import { useState, useRef, useCallback } from 'react'

/**
 * Reemplaza los diálogos nativos prompt()/confirm() por modales propios,
 * manteniendo el mismo flujo basado en promesas:
 *   const nombre = await promptModal({ title, placeholder, defaultValue })  // texto | null
 *   const ok     = await confirmModal({ title, message, danger })           // true | false
 *
 * El estado expuesto (`modalState`) lo pinta el componente <Modal>, que
 * resuelve la promesa pendiente llamando a `closeModal(valor)`.
 */
export function useModal() {
  const [modalState, setModalState] = useState(null)
  const resolverRef = useRef(null)
  const idRef = useRef(0) // identifica cada apertura (key para remontar el input)

  // Cierra el modal y resuelve la promesa pendiente con el valor dado.
  const closeModal = useCallback((value) => {
    setModalState(null)
    const resolve = resolverRef.current
    resolverRef.current = null
    if (resolve) resolve(value)
  }, [])

  const promptModal = useCallback((opts) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve
      idRef.current += 1
      setModalState({
        type: 'prompt',
        openId: idRef.current,
        confirmLabel: 'Guardar',
        cancelLabel: 'Cancelar',
        defaultValue: '',
        ...opts
      })
    })
  }, [])

  const confirmModal = useCallback((opts) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve
      idRef.current += 1
      setModalState({
        type: 'confirm',
        openId: idRef.current,
        confirmLabel: 'Confirmar',
        cancelLabel: 'Cancelar',
        ...opts
      })
    })
  }, [])

  return { modalState, closeModal, promptModal, confirmModal }
}
