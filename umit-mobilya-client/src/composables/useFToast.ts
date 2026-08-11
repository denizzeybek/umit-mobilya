import { useToast } from 'vue-toastification'

import ErrorToast from '@/components/ui/global/ErrorToast.vue'
import SuccessToast from '@/components/ui/global/SuccessToast.vue'

import type { HTMLAttributes } from 'vue'

export const useFToast = () => {
  const toast = useToast()

  const showSuccessMessage = (message: string, className?: HTMLAttributes['class']) => {
    toast(
      {
        component: SuccessToast,
        props: {
          message
        }
      },
      {
        toastClassName: `!shadow-none !bg-white ${className}`
      }
    )
  }

  /*
   * Takes whatever a catch block caught. The generated API client rejects with
   * an ApiError carrying the server's `{ statusCode, message, path }` body on
   * `.body`, so that is checked first; a plain Error falls back to `.message`.
   * Passing the error straight through is the only correct call — digging out
   * `error.response.data.message` at the call site was an axios-ism, and it
   * silently produced empty toasts once the client changed.
   */
  const showErrorMessage = (
    error: unknown,
    timeout: number = 3000,
    className?: HTMLAttributes['class']
  ) => {
    const message =
      typeof error === 'string'
        ? error
        : ((error as { body?: { message?: string } })?.body?.message ??
          (error as Error)?.message ??
          'Something went wrong!')
    toast(
      {
        component: ErrorToast,
        props: {
          message
        }
      },
      {
        toastClassName: `!shadow-none !bg-white ${className}`,
        timeout
      }
    )
  }

  return {
    showSuccessMessage,
    showErrorMessage
  }
}
