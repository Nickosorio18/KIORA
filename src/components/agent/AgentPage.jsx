import { useState } from 'react'
import AgentOnboarding from './AgentOnboarding'
import ChatInterface from './ChatInterface'

const AgentPage = () => {
  const [userProfile, setUserProfile] = useState(null)

  if (!userProfile) {
    return <AgentOnboarding onComplete={setUserProfile} />
  }

  return <ChatInterface userProfile={userProfile} />
}

export default AgentPage
