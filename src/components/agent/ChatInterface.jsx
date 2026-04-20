import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { buildSystemPrompt } from '@api/agentPrompt'
import { streamMessage } from '@api/anthropicClient'
import { usePantry } from '@context/PantryContext'
import Button from '@components/shared/Button'
import styles from './ChatInterface.module.css'

const TypingIndicator = () => (
  <div className={styles.typingBubble}>
    <span className={styles.dot} />
    <span className={styles.dot} />
    <span className={styles.dot} />
  </div>
)

// Custom markdown renderers with KYŌRA styling
const markdownComponents = {
  h1: ({ children }) => <h1 className={styles.mdH1}>{children}</h1>,
  h2: ({ children }) => <h2 className={styles.mdH2}>{children}</h2>,
  h3: ({ children }) => <h3 className={styles.mdH3}>{children}</h3>,
  ul: ({ children }) => <ul className={styles.mdUl}>{children}</ul>,
  ol: ({ children }) => <ol className={styles.mdOl}>{children}</ol>,
  li: ({ children }) => (
    <li className={styles.mdLi}>
      <span className={styles.bullet}>✦</span>
      <span>{children}</span>
    </li>
  ),
  strong: ({ children }) => <strong className={styles.mdStrong}>{children}</strong>,
  p: ({ children }) => <p className={styles.mdP}>{children}</p>,
  hr: () => <hr className={styles.mdHr} />,
}

const ChatInterface = ({ userProfile }) => {
  const { items: pantryItems } = usePantry()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  const systemPrompt = buildSystemPrompt(userProfile, pantryItems)

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  // Welcome message on mount
  useEffect(() => {
    const welcome = {
      role: 'assistant',
      content: `Hola, ${userProfile.name}. Aquí tu coach KYŌRA.\n\nYa conozco tu objetivo: **${userProfile.goal.toLowerCase()}**. ¿Quieres que arranquemos con tu plan de esta semana, o hay algo puntual en lo que te pueda ayudar hoy?`,
    }
    setMessages([welcome])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentional mount-only — welcome message should not re-fire on profile changes

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || isStreaming) return

    const userMessage = { role: 'user', content: text }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setIsStreaming(true)
    setStreamingText('')

    let accumulated = ''

    await streamMessage({
      systemPrompt,
      messages: newMessages.map(({ role, content }) => ({ role, content })),
      onDelta: (delta) => {
        accumulated += delta
        setStreamingText(accumulated)
      },
      onComplete: () => {
        setMessages((prev) => [...prev, { role: 'assistant', content: accumulated }])
        setStreamingText('')
        setIsStreaming(false)
      },
      onError: (err) => {
        console.error('Stream error:', err)
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'Lo siento, ocurrió un error al procesar tu mensaje. Por favor intenta de nuevo.',
          },
        ])
        setStreamingText('')
        setIsStreaming(false)
      },
    })
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className={styles.wrapper}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.agentInfo}>
          <div className={styles.avatar}>K</div>
          <div>
            <p className={styles.agentName}>Coach KYŌRA</p>
            <p className={styles.agentStatus}>
              <span className={styles.statusDot} />
              En línea
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => window.location.href = '/app/pantry'}>
          Mi Despensa {pantryItems.length > 0 && `(${pantryItems.length})`}
        </Button>
      </div>

      {/* Messages */}
      <div className={styles.messages}>
        {messages.map((msg, i) => (
          <div key={i} className={`${styles.message} ${styles[msg.role]}`}>
            {msg.role === 'assistant' && (
              <div className={styles.messageAvatar}>K</div>
            )}
            <div className={styles.bubble}>
              {msg.role === 'assistant' ? (
                <ReactMarkdown components={markdownComponents}>{msg.content}</ReactMarkdown>
              ) : (
                <p>{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {isStreaming && streamingText && (
          <div className={`${styles.message} ${styles.assistant}`}>
            <div className={styles.messageAvatar}>K</div>
            <div className={styles.bubble}>
              <ReactMarkdown components={markdownComponents}>{streamingText}</ReactMarkdown>
            </div>
          </div>
        )}

        {isStreaming && !streamingText && (
          <div className={`${styles.message} ${styles.assistant}`}>
            <div className={styles.messageAvatar}>K</div>
            <TypingIndicator />
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className={styles.inputArea}>
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          placeholder="Escribe tu mensaje... (Enter para enviar, Shift+Enter para nueva línea)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={isStreaming}
        />
        <Button
          variant="primary"
          size="sm"
          onClick={sendMessage}
          disabled={!input.trim() || isStreaming}
          className={styles.sendBtn}
        >
          Enviar
        </Button>
      </div>
    </div>
  )
}

export default ChatInterface
