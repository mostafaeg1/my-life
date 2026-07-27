export function playBell() {
  const AudioContextClass =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext

  if (!AudioContextClass) return

  const ctx = new AudioContextClass()
  const now = ctx.currentTime

  ;[0, 0.28, 0.56].forEach((offset) => {
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.value = 880

    gain.gain.setValueAtTime(0, now + offset)
    gain.gain.linearRampToValueAtTime(0.3, now + offset + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.4)

    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.start(now + offset)
    oscillator.stop(now + offset + 0.4)
  })

  window.setTimeout(() => ctx.close(), 1200)
}
