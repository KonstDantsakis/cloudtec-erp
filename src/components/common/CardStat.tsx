interface CardStatProps {
  label: string
  value: string
}

export function CardStat({ label, value }: CardStatProps) {
  return (
    <div className="card-stat">
      <p>{label}</p>
      <h3>{value}</h3>
    </div>
  )
}
