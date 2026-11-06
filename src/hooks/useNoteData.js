import { useOutletContext } from 'react-router-dom'

export function useNoteData() {
  return useOutletContext()
}
