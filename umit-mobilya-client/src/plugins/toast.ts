import Toast, { type PluginOptions } from 'vue-toastification'

import 'vue-toastification/dist/index.css'

import type { App } from 'vue'

const options: PluginOptions = {
  timeout: 3000,
  hideProgressBar: true,
  /*
   * vue-toastification mounts its container in a SEPARATE Vue app, which does
   * not inherit this app's globally registered components. Without this flag
   * the `<FText>` inside SuccessToast/ErrorToast fails to resolve and every
   * toast renders with no text at all — a warning in the console, and an empty
   * box on screen.
   */
  shareAppContext: true
}

export default {
  install(app: App) {
    app.use(Toast, options)
  }
}
