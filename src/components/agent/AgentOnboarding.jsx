import { useState } from 'react'
import Button from '@components/shared/Button'
import Input from '@components/shared/Input'
import styles from './AgentOnboarding.module.css'

const STEPS = [
  { id: 'name', label: '¿Cómo te llamas?', type: 'text', placeholder: 'Tu nombre', field: 'name' },
  { id: 'physical', label: 'Tus datos físicos', type: 'physical' },
  {
    id: 'goal',
    label: '¿Cuál es tu objetivo principal?',
    type: 'select',
    field: 'goal',
    options: [
      'Perder peso',
      'Ganar músculo',
      'Mejorar mi salud general',
      'Aumentar mi energía',
      'Mantener mi peso actual',
      'Mejorar mi relación con la comida',
    ],
  },
  {
    id: 'restrictions',
    label: '¿Tienes restricciones alimenticias?',
    type: 'text',
    placeholder: 'Ej: vegetariano, sin gluten, intolerante a la lactosa… o "ninguna"',
    field: 'restrictions',
  },
  {
    id: 'activity',
    label: '¿Cuál es tu nivel de actividad física?',
    type: 'select',
    field: 'activityLevel',
    options: [
      'Sedentario (poco o ningún ejercicio)',
      'Ligeramente activo (1-3 días/semana)',
      'Moderadamente activo (3-5 días/semana)',
      'Muy activo (6-7 días/semana)',
      'Extremadamente activo (trabajo físico + ejercicio)',
    ],
  },
]

const AgentOnboarding = ({ onComplete }) => {
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState({
    name: '',
    age: '',
    weight: '',
    height: '',
    goal: '',
    restrictions: '',
    activityLevel: '',
  })

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  const update = (field, value) => setProfile((p) => ({ ...p, [field]: value }))

  const canAdvance = () => {
    if (current.type === 'physical') {
      return profile.age && profile.weight && profile.height
    }
    if (current.field) return !!profile[current.field]
    return true
  }

  const advance = () => {
    if (isLast) {
      onComplete(profile)
    } else {
      setStep((s) => s + 1)
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <span className={styles.stepCounter}>
          Paso {step + 1} de {STEPS.length}
        </span>

        <h2 className={styles.question}>{current.label}</h2>

        <div className={styles.inputArea}>
          {current.type === 'text' && (
            <Input
              placeholder={current.placeholder}
              value={profile[current.field]}
              onChange={(e) => update(current.field, e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && canAdvance() && advance()}
              autoFocus
            />
          )}

          {current.type === 'physical' && (
            <div className={styles.physicalGrid}>
              <Input
                label="Edad"
                type="number"
                placeholder="Años"
                value={profile.age}
                onChange={(e) => update('age', e.target.value)}
                min="10"
                max="120"
              />
              <Input
                label="Peso"
                type="number"
                placeholder="kg"
                value={profile.weight}
                onChange={(e) => update('weight', e.target.value)}
                min="20"
                max="300"
              />
              <Input
                label="Altura"
                type="number"
                placeholder="cm"
                value={profile.height}
                onChange={(e) => update('height', e.target.value)}
                min="100"
                max="250"
              />
            </div>
          )}

          {current.type === 'select' && (
            <div className={styles.options}>
              {current.options.map((opt) => (
                <button
                  key={opt}
                  className={`${styles.option} ${profile[current.field] === opt ? styles.selected : ''}`}
                  onClick={() => update(current.field, opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.actions}>
          {step > 0 && (
            <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
              Atrás
            </Button>
          )}
          <Button
            variant="primary"
            onClick={advance}
            disabled={!canAdvance()}
            className={styles.nextBtn}
          >
            {isLast ? 'Comenzar mi plan ✦' : 'Continuar'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default AgentOnboarding
