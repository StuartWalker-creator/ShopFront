
export const PLAN_LIMITS = {
    basic: {
      products: 5,
      customDomain: false,
      ai: {
        theming: false,
        description: false,
      },
    },
    standard: {
      products: Infinity,
      customDomain: true,
      ai: {
        theming: false,
        description: false,
      },
    },
    premium: {
      products: Infinity,
      customDomain: true,
      ai: {
        theming: true,
        description: true,
      },
    },
    enterprise: {
      products: Infinity,
      customDomain: true,
      ai: {
        theming: true,
        description: true,
      },
    },
  };
  