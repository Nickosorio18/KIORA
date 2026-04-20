import styles from './Button.module.css'

/**
 * variant: 'primary' | 'secondary' | 'ghost'
 * size: 'sm' | 'md' | 'lg'
 */
const Button = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  return (
    <button
      className={`${styles.btn} ${styles[variant]} ${styles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
