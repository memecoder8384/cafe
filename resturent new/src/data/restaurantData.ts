export interface MenuItem {
  id: string;
  name: string;
  frenchName?: string;
  description: string;
  price: string;
  category: 'antipasti' | 'pasta' | 'principale' | 'cocktails' | 'dolci';
  dietary?: string[];
  image: string;
  popular?: boolean;
}

export interface LocationItem {
  id: string;
  city: string;
  neighborhood: string;
  address: string;
  phone: string;
  hours: string;
  status: 'open' | 'closed' | 'coming-soon';
  statusText: string;
  image: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  aspectRatio: 'square' | 'portrait' | 'landscape';
  image: string;
}

export interface EventTag {
  id: string;
  label: string;
  bgColor: string;
  textColor: string;
}

export const RESTAURANT_INFO = {
  name: "Bistrot Chérie",
  tagline: "Life is a party, and the table is a feast.",
  subTagline: "An energetic fusion of Parisian bistro elegance and Italian trattoria soul. Fresh pasta made daily at 5 AM, natural wines from small European vineyards, and late-night vinyl records.",
  established: "2019",
  phone: "+33 1 42 68 55 90",
  email: "ciao@bistrotcherie.com",
};

export const HERO_PHOTOS = [
  {
    id: "hero-1",
    url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=85",
    alt: "Handcrafted tagliatelle with shaved black truffle",
    caption: "Tagliatelle al Tartufo",
    rotation: -5,
    top: "12%",
    left: "5%",
    size: "w-44 md:w-64 h-56 md:h-80",
    depth: 1.2
  },
  {
    id: "hero-2",
    url: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=900&q=85",
    alt: "Natural orange wine pour in crystal goblet",
    caption: "Vin Naturel du Rhône",
    rotation: 6,
    top: "8%",
    right: "6%",
    size: "w-40 md:w-60 h-52 md:h-72",
    depth: 0.9
  },
  {
    id: "hero-3",
    url: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=85",
    alt: "Prime Bistecca with rosemary smoke and charred lemon",
    caption: "Bistecca alla Fiorentina",
    rotation: -4,
    bottom: "10%",
    left: "8%",
    size: "w-48 md:w-72 h-44 md:h-64",
    depth: 1.5
  },
  {
    id: "hero-4",
    url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=85",
    alt: "Warm candlelit bistro dining room with brass fittings",
    caption: "Le Grand Salon",
    rotation: 7,
    bottom: "8%",
    right: "7%",
    size: "w-44 md:w-64 h-56 md:h-80",
    depth: 1.1
  },
  {
    id: "hero-5",
    url: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=900&q=85",
    alt: "Artisanal Tiramisu with cocoa dusting",
    caption: "Tiramisu Chérie",
    rotation: 3,
    top: "45%",
    right: "2%",
    size: "w-36 md:w-52 h-44 md:h-60",
    depth: 0.8
  },
  {
    id: "hero-6",
    url: "https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&w=900&q=85",
    alt: "Negroni Sbagliato with fresh blood orange slice",
    caption: "Chérie Spritz",
    rotation: -7,
    top: "48%",
    left: "2%",
    size: "w-36 md:w-52 h-44 md:h-60",
    depth: 1.3
  }
];

export const MARQUEE_EVENTS: EventTag[] = [
  { id: "1", label: "Match Night", bgColor: "#C8321F", textColor: "#FFFFFF" },
  { id: "2", label: "Lunch Break 12-3PM", bgColor: "#1F3D2B", textColor: "#F6EFE3" },
  { id: "3", label: "Afterwork Aperitivo", bgColor: "#E9B44C", textColor: "#1A1A1A" },
  { id: "4", label: "Live Vinyl DJ Set", bgColor: "#1A1A1A", textColor: "#F6EFE3" },
  { id: "5", label: "Open Mic & Jazz", bgColor: "#C8321F", textColor: "#FFFFFF" },
  { id: "6", label: "Natural Cocktails", bgColor: "#1F3D2B", textColor: "#F6EFE3" },
  { id: "7", label: "Tapas Fiesta", bgColor: "#E9B44C", textColor: "#1A1A1A" },
  { id: "8", label: "Sunlit Terrace", bgColor: "#ECE3D2", textColor: "#1A1A1A" },
  { id: "9", label: "Sunday Truffle Brunch", bgColor: "#C8321F", textColor: "#FFFFFF" },
  { id: "10", label: "Late Night Pasta 11PM", bgColor: "#1F3D2B", textColor: "#F6EFE3" },
];

export const GALLERY_IMAGES: GalleryItem[] = [
  {
    id: "gal-1",
    title: "Crispy Burrata & Heritage Tomatoes",
    category: "Antipasti",
    aspectRatio: "portrait",
    image: "https://images.unsplash.com/photo-1592417817098-8f3d6eb19655?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "gal-2",
    title: "Hand-Rolled Agnolotti dal Plin",
    category: "Pasta Fresca",
    aspectRatio: "square",
    image: "https://images.unsplash.com/photo-1621996346565-e3d5d6281292?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "gal-3",
    title: "Bistro Interior at Golden Hour",
    category: "Atmosphere",
    aspectRatio: "landscape",
    image: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "gal-4",
    title: "Smokey Mezcal & Campari Fizz",
    category: "Cocktails",
    aspectRatio: "portrait",
    image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "gal-5",
    title: "Wood-Fired Neapolitan Margherita",
    category: "Artisanal Pizza",
    aspectRatio: "square",
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "gal-6",
    title: "Chef Marco Finishing Roasted Duck Breast",
    category: "Kitchen Secrets",
    aspectRatio: "portrait",
    image: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "gal-7",
    title: "Pistachio Cannoli with Candied Orange",
    category: "Dolci",
    aspectRatio: "landscape",
    image: "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "gal-8",
    title: "Natural Pet-Nat Sparkling Pour",
    category: "Wine Cellar",
    aspectRatio: "portrait",
    image: "https://images.unsplash.com/photo-1569919659476-f0852f6834b7?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "gal-9",
    title: "Late Night Candlelit Conversations",
    category: "Atmosphere",
    aspectRatio: "square",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "gal-10",
    title: "Grilled Octopus with Nduja Emulsion",
    category: "Principale",
    aspectRatio: "landscape",
    image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "gal-11",
    title: "Wild Mushroom Arancini",
    category: "Antipasti",
    aspectRatio: "portrait",
    image: "https://images.unsplash.com/photo-1608897013039-887f21d8c804?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "gal-12",
    title: "Espresso Martini with Tonka Bean Shave",
    category: "Cocktails",
    aspectRatio: "square",
    image: "https://images.unsplash.com/photo-1545438102-799c3991ffb2?auto=format&fit=crop&w=800&q=80"
  }
];

export const LOCATIONS: LocationItem[] = [
  {
    id: "loc-1",
    city: "Paris",
    neighborhood: "Le Marais",
    address: "34 Rue des Archives, 75004 Paris",
    phone: "+33 1 42 68 55 90",
    hours: "Mon-Sun: 12:00 PM - 01:30 AM",
    status: "open",
    statusText: "Open Now • DJ Set Tonight",
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "loc-2",
    city: "Milano",
    neighborhood: "Brera District",
    address: "Via Fiori Chiari 18, 20121 Milano",
    phone: "+39 02 8901 3412",
    hours: "Tue-Sun: 12:30 PM - 01:00 AM",
    status: "open",
    statusText: "Open Now • Terrace Table Available",
    image: "https://images.unsplash.com/photo-1513581166391-887a96ddeafd?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "loc-3",
    city: "New York",
    neighborhood: "SoHo",
    address: "142 Spring Street, New York, NY 10012",
    phone: "+1 (212) 843-9920",
    hours: "Wed-Mon: 05:00 PM - 02:00 AM",
    status: "closed",
    statusText: "Closed • Opens 5:00 PM",
    image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "loc-4",
    city: "Saint-Tropez",
    neighborhood: "La Ponche",
    address: "Place des Lices, 83990 Saint-Tropez",
    phone: "+33 4 94 97 00 11",
    hours: "Seasonal Summer Opening",
    status: "coming-soon",
    statusText: "Coming Spring 2027",
    image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=900&q=80"
  }
];

export const FEATURED_DISHES: MenuItem[] = [
  {
    id: "dish-1",
    name: "Tagliatelle al Tartufo",
    frenchName: "Tagliatelles à la Truffe Noire",
    description: "Hand-rolled egg pasta with 36-month aged Parmigiano Reggiano, cultured French butter, and fresh Norcia black truffle shaved tableside.",
    price: "€28",
    category: "pasta",
    dietary: ["Vegetarian", "Chef's Signature"],
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=85",
    popular: true
  },
  {
    id: "dish-2",
    name: "Burrata Pugliese & Pêches Rôties",
    frenchName: "Burrata aux Pêches Rôties",
    description: "Creamy 250g Puglia burrata paired with roasted white peaches, 25-year aged Modena balsamic, wild thyme, and toasted Sicilian pistachios.",
    price: "€21",
    category: "antipasti",
    dietary: ["Vegetarian", "Organic"],
    image: "https://images.unsplash.com/photo-1592417817098-8f3d6eb19655?auto=format&fit=crop&w=900&q=85",
    popular: true
  },
  {
    id: "dish-3",
    name: "Côte de Boeuf à la Fiorentina",
    frenchName: "Côte de Bœuf au Romarin",
    description: "Dry-aged 45-day Chianina beef ribeye grilled over olive wood embers, served with bone marrow jus, roasted garlic bulb, and crispy rosemary potatoes.",
    price: "€85 (For two)",
    category: "principale",
    dietary: ["Gluten-Free", "Wood-Fired"],
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=85",
    popular: false
  },
  {
    id: "dish-4",
    name: "Tiramisu au Calvados",
    frenchName: "Tiramisu Signature Chérie",
    description: "Savoiardi soaked in single-origin Ethiopian espresso and aged Normandy Calvados, layered with whipped mascarpone and dark Valrhona 70% chocolate shavings.",
    price: "€14",
    category: "dolci",
    dietary: ["Vegetarian"],
    image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=900&q=85",
    popular: true
  },
  {
    id: "dish-5",
    name: "Chérie Spritz Royale",
    frenchName: "Cocktail Signature Chérie",
    description: "Select Aperitivo infused with fresh raspberries, Italicus Bergamot liqueur, organic Prosecco Superiore, and a dash of sparkling soda.",
    price: "€16",
    category: "cocktails",
    dietary: ["Vegan", "Organic"],
    image: "https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&w=900&q=85",
    popular: true
  }
];

export const MENU_CATEGORIES = [
  { id: "all", name: "All Dishes" },
  { id: "antipasti", name: "Antipasti & Starters" },
  { id: "pasta", name: "Fresh Pasta (Fatta a Mano)" },
  { id: "principale", name: "Grill & Principale" },
  { id: "cocktails", name: "Vins & Cocktails" },
  { id: "dolci", name: "Dolci & Desserts" }
];

export const FULL_MENU_ITEMS: MenuItem[] = [
  ...FEATURED_DISHES,
  {
    id: "dish-6",
    name: "Arancini al Ragù di Cervo",
    frenchName: "Arancini au Ragout de Cerf",
    description: "Crispy saffron risotto spheres filled with slow-braised venison ragù and molten smoked scamorza cheese.",
    price: "€18",
    category: "antipasti",
    dietary: ["Chef Special"],
    image: "https://images.unsplash.com/photo-1608897013039-887f21d8c804?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "dish-7",
    name: "Pappardelle al Cinghiale",
    frenchName: "Pappardelles au Sanglier",
    description: "Wide ribbon pasta with 12-hour braised wild boar ragù, juniper berries, and crushed Valdostana chestnuts.",
    price: "€26",
    category: "pasta",
    dietary: ["Organic"],
    image: "https://images.unsplash.com/photo-1621996346565-e3d5d6281292?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "dish-8",
    name: "Polpo alla Griglia con Nduja",
    frenchName: "Poulpe Grillé à la Nduja",
    description: "Charred Mediterranean octopus tentacle over smoky Cannellini bean puree, spicy Calabrian Nduja emulsion, and pickled shallots.",
    price: "€32",
    category: "principale",
    dietary: ["Gluten-Free"],
    image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "dish-9",
    name: "Cannoli Siciliani al Pistacchio",
    frenchName: "Cannoli au Pistache de Bronte",
    description: "Crispy fried pastry shells stuffed with sweet sheep ricotta, candied Amalfi lemon peel, and crushed Bronte pistachios.",
    price: "€12",
    category: "dolci",
    dietary: ["Vegetarian"],
    image: "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "dish-10",
    name: "Smoky Mezcal Paloma Italian",
    frenchName: "Paloma Italienne Fumée",
    description: "Oaxacan Mezcal, Solerno Blood Orange Liqueur, fresh ruby red grapefruit juice, lime, and smoked sea salt rim.",
    price: "€17",
    category: "cocktails",
    dietary: ["Vegan"],
    image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80"
  }
];

export const STAMP_ICONS = [
  { emoji: "🍷", label: "Vino", bg: "#C8321F", color: "#FFFFFF" },
  { emoji: "🍕", label: "Pizza", bg: "#E9B44C", color: "#1A1A1A" },
  { emoji: "🍝", label: "Pasta", bg: "#1F3D2B", color: "#F6EFE3" },
  { emoji: "🍸", label: "Spritz", bg: "#C8321F", color: "#FFFFFF" },
  { emoji: "🌶️", label: "Piccante", bg: "#C8321F", color: "#FFFFFF" },
  { emoji: "🧀", label: "Burrata", bg: "#E9B44C", color: "#1A1A1A" },
  { emoji: "✨", label: "Chérie!", bg: "#1F3D2B", color: "#F6EFE3" },
  { emoji: "🥖", label: "Baguette", bg: "#ECE3D2", color: "#1A1A1A" },
];
