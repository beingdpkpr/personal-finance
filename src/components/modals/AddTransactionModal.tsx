import { useFinanceContext } from '../../hooks/FinanceContext'

export default function AddTransactionModal() {
  const { modalVisible } = useFinanceContext()
  if (!modalVisible) return null
  return <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000 }} />
}
