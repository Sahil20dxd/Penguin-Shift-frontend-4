// utils/index.ts (or wherever)
export const createPageUrl = (name: string) => {
    switch (name) {
      case 'SelectPlaylist':     return '/shift/select'
      case 'SelectDestination':  return '/shift/destination'
      case 'TransferResults':    return '/shift/results'
      case 'Dashboard':          return '/dashboard'
      case 'LandingPage':        return '/'
      case 'Contact':            return '/contact'
      case 'Auth':               return '/auth'
      default:                   return '/'
    }
  }
  