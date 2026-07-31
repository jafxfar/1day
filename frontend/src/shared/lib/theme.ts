const mq = window.matchMedia('(prefers-color-scheme: dark)')

const applyDarkMode = () => {
  document.documentElement.classList.toggle('dark', mq.matches)
}

applyDarkMode()
mq.addEventListener('change', applyDarkMode)