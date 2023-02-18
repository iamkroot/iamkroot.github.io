const isServer = typeof window === 'undefined'

const getTheme = (key, fallback = undefined) => {
  if (isServer) return undefined
  let theme
  try {
    theme = localStorage.getItem(key) || undefined
  } catch (e) {
    // Unsupported
  }
  return theme || fallback
}

function* getMediaRules() {
  for (let i = 0; i < document.styleSheets.length; i++) {
    const sheet = document.styleSheets[i]
    for (let j = 0; j < sheet.cssRules.length; j++) {
      const rule = sheet.cssRules[j]
      if (rule instanceof CSSMediaRule) {
        yield rule
      }
    }
  }
}

const CS_PAT = /(?<disabled>disabled-)?prefers-color-scheme\s*:\s*(?<name>\w+)/

function* getColorSchemeRules() {
  for (const rule of getMediaRules()) {
    for (const media of rule.media) {
      const match = CS_PAT.exec(media)
      if (match != null) {
        yield [rule, match.groups.name, !!match.groups.disabled]
        continue
      }
    }
  }
}

const applyTheme = (newTheme) => {
  console.log({ newTheme })
  // setThemeState(newTheme);
  localStorage.setItem('theme', newTheme)
  for (const [rule, preference, disabled] of getColorSchemeRules()) {
    if (!(rule instanceof CSSMediaRule)) {
      continue
    }
    // TODO: Clean up this code, support more than two preferences
    if (newTheme == 'light') {
      if (preference == 'dark' && !disabled) {
        // disable the "prefers-color-scheme: dark" media rule
        rule.media.deleteMedium('(prefers-color-scheme: dark)')
        rule.media.appendMedium('(disabled-prefers-color-scheme: dark)')
      } else if (preference == 'light' && disabled) {
        // enable the "prefers-color-scheme: light" media rule
        rule.media.appendMedium('(prefers-color-scheme: light)')
        rule.media.deleteMedium('(disabled-prefers-color-scheme: light)')
      }
    } else {
      if (preference == 'light' && !disabled) {
        // disable the "prefers-color-scheme: light" media rule
        rule.media.deleteMedium('(prefers-color-scheme: light)')
        rule.media.appendMedium('(disabled-prefers-color-scheme: light)')
      } else if (preference == 'dark' && disabled) {
        // enable the "prefers-color-scheme: dark" media rule
        rule.media.appendMedium('(prefers-color-scheme: dark)')
        rule.media.deleteMedium('(disabled-prefers-color-scheme: dark)')
      }
    }
  }
}

// FIXME: This stuff should be inside a ThemeProvider

let theme = localStorage.getItem('theme')
if ('theme' in localStorage && theme !== 'null') {
  applyTheme(theme)
}
