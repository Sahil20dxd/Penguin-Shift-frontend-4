declare module '*.png' {
    const value: string
    export default value
  }
  // Support for vite-imagetools query parameters
  declare module '*.png?*' {
    const value: string
    export default value
  }
  declare module '*.jpg?*' {
    const value: string
    export default value
  }
  declare module '*.jpeg?*' {
    const value: string
    export default value
  }
  declare module '*.jpg' {
    const value: string
    export default value
  }
  declare module '*.jpeg' {
    const value: string
    export default value
  }
  declare module '*.svg' {
    const value: string
    export default value
  }
  declare module '*.webp' {
    const value: string
    export default value
  }
  