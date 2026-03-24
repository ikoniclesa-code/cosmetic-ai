export interface TranslationKeys {
  common: {
    appName: string;
    loading: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    back: string;
    next: string;
    submit: string;
    generate: string;
    download: string;
    copy: string;
    copied: string;
    search: string;
    noResults: string;
    error: string;
    success: string;
    credits: string;
  };
  auth: {
    login: string;
    register: string;
    logout: string;
    email: string;
    password: string;
    fullName: string;
    forgotPassword: string;
    resetPassword: string;
    newPassword: string;
    confirmPassword: string;
    noAccount: string;
    hasAccount: string;
    registerCta: string;
    loginCta: string;
    resetSent: string;
  };
  dashboard: {
    title: string;
    welcome: string;
    quickActions: string;
    createText: string;
    createImage: string;
    createPost: string;
    createTextDesc: string;
    createImageDesc: string;
    createPostDesc: string;
    remainingCredits: string;
  };
  generate: {
    textTitle: string;
    imageTitle: string;
    uploadTitle: string;
    prompt: string;
    promptPlaceholder: string;
    uploadImage: string;
    uploadOptional: string;
    generating: string;
    result: string;
    insufficientCredits: string;
    insufficientCreditsDesc: string;
    goToPricing: string;
    tryAgain: string;
    errorGeneral: string;
  };
  history: {
    title: string;
    empty: string;
    emptyDesc: string;
    type: string;
    date: string;
    credits: string;
    status: string;
    text: string;
    image: string;
    imageFromUpload: string;
  };
  analytics: {
    title: string;
    totalGenerations: string;
    totalCreditsUsed: string;
    textGenerations: string;
    imageGenerations: string;
    uploadGenerations: string;
  };
  settings: {
    title: string;
    profile: string;
    brand: string;
    subscription: string;
    language: string;
    changePassword: string;
    managePlan: string;
    currentPlan: string;
    noPlan: string;
  };
  pricing: {
    title: string;
    monthly: string;
    yearly: string;
    yearlyDiscount: string;
    perMonth: string;
    perYear: string;
    subscribe: string;
    currentPlan: string;
    creditsPerMonth: string;
  };
  onboarding: {
    title: string;
    step1Title: string;
    step1Desc: string;
    cosmetics: string;
    cosmeticsDesc: string;
    homeChemistry: string;
    homeChemistryDesc: string;
    step2Title: string;
    step2Desc: string;
    brandName: string;
    brandDescription: string;
    targetAudience: string;
    communicationTone: string;
    step3Title: string;
    step3Desc: string;
    skip: string;
    finish: string;
  };
  errors: {
    generic: string;
    unauthorized: string;
    forbidden: string;
    notFound: string;
    rateLimited: string;
    fileTooLarge: string;
    invalidFormat: string;
    serverError: string;
  };
  admin: {
    title: string;
    users: string;
    totalUsers: string;
    totalRevenue: string;
    activeSubscriptions: string;
    adjustCredits: string;
    impersonate: string;
    logs: string;
  };
}

export const sr: TranslationKeys = {
  common: {
    appName: "Cosmetic AI",
    loading: "Učitavanje...",
    save: "Sačuvaj",
    cancel: "Otkaži",
    delete: "Obriši",
    edit: "Izmeni",
    back: "Nazad",
    next: "Dalje",
    submit: "Pošalji",
    generate: "Generiši",
    download: "Preuzmi",
    copy: "Kopiraj",
    copied: "Kopirano!",
    search: "Pretraži",
    noResults: "Nema rezultata",
    error: "Greška",
    success: "Uspešno",
    credits: "Krediti",
  },
  auth: {
    login: "Prijava",
    register: "Registracija",
    logout: "Odjava",
    email: "Email adresa",
    password: "Lozinka",
    fullName: "Puno ime",
    forgotPassword: "Zaboravljena lozinka?",
    resetPassword: "Resetuj lozinku",
    newPassword: "Nova lozinka",
    confirmPassword: "Potvrdi lozinku",
    noAccount: "Nemate nalog?",
    hasAccount: "Već imate nalog?",
    registerCta: "Registrujte se",
    loginCta: "Prijavite se",
    resetSent: "Link za reset lozinke je poslat na vaš email",
  },
  dashboard: {
    title: "Početna",
    welcome: "Dobrodošli",
    quickActions: "Brze akcije",
    createText: "Kreiraj tekst",
    createImage: "Kreiraj sliku",
    createPost: "Kreiraj post",
    createTextDesc: "Generišite tekst za društvene mreže",
    createImageDesc: "Generišite sliku na osnovu opisa",
    createPostDesc: "Generišite post na osnovu vaše fotografije",
    remainingCredits: "Preostali krediti",
  },
  generate: {
    textTitle: "Kreiraj tekst za društvene mreže",
    imageTitle: "Kreiraj sliku",
    uploadTitle: "Kreiraj post od fotografije",
    prompt: "Opišite šta želite",
    promptPlaceholder: "Napišite prompt...",
    uploadImage: "Dodajte fotografiju",
    uploadOptional: "(opciono)",
    generating: "Generisanje u toku...",
    result: "Rezultat",
    insufficientCredits: "Nemate dovoljno kredita",
    insufficientCreditsDesc: "Potrebno je {cost} kredita. Imate {current}.",
    goToPricing: "Pogledajte planove",
    tryAgain: "Pokušajte ponovo",
    errorGeneral: "Došlo je do greške prilikom generisanja",
  },
  history: {
    title: "Istorija",
    empty: "Još niste generisali sadržaj",
    emptyDesc: "Kada kreirate tekst ili sliku, pojaviće se ovde",
    type: "Tip",
    date: "Datum",
    credits: "Krediti",
    status: "Status",
    text: "Tekst",
    image: "Slika",
    imageFromUpload: "Post",
  },
  analytics: {
    title: "Analitika",
    totalGenerations: "Ukupno generisanja",
    totalCreditsUsed: "Utrošeni krediti",
    textGenerations: "Tekstovi",
    imageGenerations: "Slike",
    uploadGenerations: "Postovi",
  },
  settings: {
    title: "Podešavanja",
    profile: "Profil",
    brand: "Brend",
    subscription: "Pretplata",
    language: "Jezik",
    changePassword: "Promena lozinke",
    managePlan: "Upravljajte pretplatom",
    currentPlan: "Trenutni plan",
    noPlan: "Nemate aktivan plan",
  },
  pricing: {
    title: "Planovi i cene",
    monthly: "Mesečno",
    yearly: "Godišnje",
    yearlyDiscount: "Uštedite 20%",
    perMonth: "/mesec",
    perYear: "/godišnje",
    subscribe: "Pretplatite se",
    currentPlan: "Trenutni plan",
    creditsPerMonth: "kredita mesečno",
  },
  onboarding: {
    title: "Hajde da postavimo vaš profil",
    step1Title: "Izaberite industriju",
    step1Desc: "U kom sektoru poslujete?",
    cosmetics: "Kozmetika",
    cosmeticsDesc: "Kreme, maske, šminke i sl.",
    homeChemistry: "Kućna hemija",
    homeChemistryDesc: "Deterdženti, odmašćivači, praškovi i sl.",
    step2Title: "Podaci o brendu",
    step2Desc: "Recite nam nešto o vašem brendu (opciono)",
    brandName: "Ime brenda",
    brandDescription: "Opis brenda",
    targetAudience: "Ciljna grupa",
    communicationTone: "Ton komunikacije",
    step3Title: "Društvene mreže",
    step3Desc: "Na kojim mrežama ste prisutni? (opciono)",
    skip: "Preskoči",
    finish: "Završi",
  },
  errors: {
    generic: "Došlo je do greške. Pokušajte ponovo.",
    unauthorized: "Niste prijavljeni. Prijavite se da biste nastavili.",
    forbidden: "Nemate pristup ovoj stranici.",
    notFound: "Stranica nije pronađena.",
    rateLimited: "Previše zahteva. Sačekajte malo.",
    fileTooLarge: "Fajl je prevelik. Maksimalno 10 MB.",
    invalidFormat: "Nepodržan format. Dozvoljeni: JPG, PNG, WebP.",
    serverError: "Greška na serveru. Pokušajte ponovo kasnije.",
  },
  admin: {
    title: "Admin Panel",
    users: "Korisnici",
    totalUsers: "Ukupno korisnika",
    totalRevenue: "Ukupan prihod",
    activeSubscriptions: "Aktivne pretplate",
    adjustCredits: "Koriguj kredite",
    impersonate: "Prijavi se kao korisnik",
    logs: "Logovi",
  },
};
