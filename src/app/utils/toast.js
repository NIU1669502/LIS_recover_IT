// ============================================================
// Utilitat: showToast — Dispara un event global de notificació
// Ús: showToast('Missatge', 'success' | 'error' | 'info' | 'warning')
// ============================================================
export function showToast(message, type = 'info') {
    window.dispatchEvent(new CustomEvent('app-toast', { detail: { message, type } }))
}
