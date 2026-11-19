/* =========================================================
   DATA.JS — Contenido del museo (lo que ve el visitante va en INGLÉS).
   Museo 2: "The Silicon Rotunda". UNA sola foto por año (9 años).
   Cada año tiene:
   - name, type, text, source: la computadora del año
   - blurb: mini texto de una línea (va debajo de la foto y abajo en la pantalla)
   - image: la foto (carpeta images/, copia en photos.js)
   - credit: autor, licencia y enlace de la foto en Wikimedia Commons
   - theme: la decoración de su nicho (colores y dibujo de la pared)
   ========================================================= */

const MUSEUM = {
  title: "The Silicon Rotunda",
  subtitle: "A computer museum, 1995–2003",
  tagline: "Nine years · nine machines · one photo for every year",
  intro: "Welcome to The Silicon Rotunda. This round hall has nine rooms, one for every year from 1995 to 2003. Each room shows one real computer from that year. Tap a dot on the timeline at the top to visit a year, or walk around."
};

const YEARS = [
  {
    year: 1995,
    blurb: "The ThinkPad 701C had a \"butterfly\" keyboard that unfolded to full size when the laptop opened.",
    name: "IBM ThinkPad 701C",
    type: "Laptop",
    image: "images/1995-thinkpad-701.jpg",
    caption: "IBM ThinkPad 701 laptop open, with its full-size \"butterfly\" keyboard.",
    text: "IBM released the ThinkPad 701C laptop. Its \"Track Write\" keyboard, designed by John Karidis, was made of interlocking pieces that formed a full-size keyboard when the laptop opened, wider than the case itself. It was nicknamed \"the Butterfly\", and it is part of the permanent collection of the Museum of Modern Art (MoMA).",
    source: "Computer History Museum, Timeline 1995; IBM History, ThinkPad",
    credit: { author: "nakashi", license: "CC BY-SA 2.0", link: "https://commons.wikimedia.org/wiki/File:Thinkpad_701.jpg" },
    theme: { title: "The Butterfly", wall: "#3a3a3e", dark: "#26262a", accent: "#b2343a", frame: "#141414", pattern: "keys" }
  },
  {
    year: 1996,
    blurb: "The PowerBook 1400 was the first PowerBook with a built-in CD-ROM drive.",
    name: "Apple PowerBook 1400",
    type: "Laptop",
    image: "images/1996-powerbook-1400.jpg",
    caption: "Apple PowerBook 1400cs laptop.",
    text: "In October 1996, Apple introduced the PowerBook 1400 laptop with a PowerPC 603e processor at 117 or 133 MHz and an 11.3-inch screen. It was the first PowerBook with a built-in CD-ROM drive, in a bay that could also hold a floppy drive or a second battery, and its lid used a removable \"BookCover\" that owners could personalize.",
    source: "Apple Support, PowerBook 1400 Technical Specifications",
    credit: { author: "GeneralFreddy", license: "CC BY 4.0", link: "https://commons.wikimedia.org/wiki/File:1400cs.jpg" },
    theme: { title: "The BookCover", wall: "#3b5a5a", dark: "#273d3d", accent: "#b89a5e", frame: "#4a3320", pattern: "books" }
  },
  {
    year: 1997,
    blurb: "The Power Macintosh G3 was the first Mac with the PowerPC G3 processor.",
    name: "Apple Power Macintosh G3",
    type: "Desktop",
    image: "images/1997-power-macintosh-g3.jpg",
    caption: "Power Macintosh G3 desktop with its monitor, keyboard and mouse (All About Apple Museum, Italy).",
    text: "On November 10, 1997, Apple introduced the Power Macintosh G3, the first Macintosh with the PowerPC G3 processor, at 233 or 266 MHz. It came in a beige desktop case or a mini-tower, with a CD-ROM drive and room to add memory and expansion cards.",
    source: "Apple Support, Power Macintosh G3 (Desktop) Technical Specifications",
    credit: { author: "All About Apple Museum", license: "CC BY-SA 3.0", link: "https://commons.wikimedia.org/wiki/File:PowerMac_g3_233.jpg" },
    theme: { title: "The Beige Box", wall: "#b9a888", dark: "#8a7a5f", accent: "#5e3d27", frame: "#6b4b2a", pattern: "rainbow" }
  },
  {
    year: 1998,
    blurb: "The iMac put the whole computer and its screen in one colorful, translucent case.",
    name: "Apple iMac",
    type: "All-in-one desktop",
    image: "images/1998-imac-g3.jpg",
    caption: "iMac G3 in Bondi Blue.",
    text: "Apple launched the Bondi Blue iMac, an all-in-one computer for about $1,300. It had a 233 MHz G3 processor, 32 MB of RAM, a 4 GB hard drive, a CD-ROM drive and a 15-inch monitor in a single translucent case.",
    source: "Computer History Museum, Timeline 1998",
    credit: { author: "David Fuchs (based on a photo by Rama)", license: "CC BY-SA 4.0", link: "https://commons.wikimedia.org/wiki/File:IMac_G3_Bondi_Blue,_three-quarters_view.png" },
    theme: { title: "Bondi Blue", wall: "#2f6a73", dark: "#1f4a51", accent: "#cfe3e5", frame: "#1c1c1c", pattern: "bubbles" }
  },
  {
    year: 1999,
    blurb: "The iBook was the first \"wireless ready\" laptop, with a slot for an AirPort card.",
    name: "Apple iBook",
    type: "Laptop",
    image: "images/1999-ibook.jpg",
    caption: "Apple iBook G3 in Blueberry, closed and open.",
    text: "On July 21, 1999, Apple introduced the iBook laptop with a PowerPC G3 processor (300 or 366 MHz), a 12.1-inch display, a CD-ROM drive, USB and Ethernet. It was the first \"wireless ready\" portable: it had built-in antennas and a slot for an AirPort card, which let up to 10 computers share one Internet connection at up to 11 Mbps.",
    source: "Apple Support, iBook Technical Specifications; Apple Newsroom (January 25, 2000)",
    credit: { author: "Ocmey", license: "Public domain", link: "https://commons.wikimedia.org/wiki/File:IBookG3_Palourde2.png" },
    theme: { title: "Tangerine & Blueberry", wall: "#9c5a33", dark: "#6f3e22", accent: "#e9dccb", frame: "#2a2a2a", pattern: "waves" }
  },
  {
    year: 2000,
    blurb: "The Power Mac G4 Cube was a powerful desktop inside an eight-inch clear cube.",
    name: "Apple Power Mac G4 Cube",
    type: "Desktop",
    image: "images/2000-power-mac-g4-cube.jpg",
    caption: "Power Mac G4 Cube in its clear acrylic case.",
    text: "On July 19, 2000, Apple introduced the Power Mac G4 Cube, a desktop computer inside an eight-inch cube with a clear enclosure. It had a 450 MHz PowerPC G4 processor (500 MHz optional) and 64 MB of memory, expandable to 1.5 GB.",
    source: "Apple Newsroom, Power Mac G4 Cube press release (July 19, 2000)",
    credit: { author: "Binarysequence", license: "CC BY-SA 4.0", link: "https://commons.wikimedia.org/wiki/File:Apple_Power_Mac_G4_Cube_-_Product_Shot.jpg" },
    theme: { title: "The Clear Cube", wall: "#33375a", dark: "#22253e", accent: "#d6dbe6", frame: "#b9bec6", pattern: "cubes" }
  },
  {
    year: 2001,
    blurb: "The Titanium PowerBook G4 was about one inch thick, with a wide 15.2-inch screen.",
    name: "Apple Titanium PowerBook G4",
    type: "Laptop",
    image: "images/2001-powerbook-g4.jpg",
    caption: "Titanium PowerBook G4 (later 1 GHz model).",
    text: "On January 9, 2001, Apple unveiled the PowerBook G4, a titanium laptop about one inch thick that weighed 5.3 pounds. It had a 15.2-inch widescreen display, a PowerPC G4 processor of up to 500 MHz and up to five hours of battery life. Prices started at US $2,599.",
    source: "Apple Newsroom, \"Apple Unveils One Inch Thick Titanium PowerBook G4\" (January 9, 2001)",
    credit: { author: "Ashley Pomeroy", license: "CC BY-SA 4.0", link: "https://commons.wikimedia.org/wiki/File:1ghz_Titanium_Apple_PowerBook_G4.jpg" },
    theme: { title: "Titanium", wall: "#62666c", dark: "#45484d", accent: "#d9cfae", frame: "#a7abb0", pattern: "brushed" }
  },
  {
    year: 2002,
    blurb: "The iMac G4 had a flat screen on a movable chrome neck above a round base.",
    name: "Apple iMac G4",
    type: "All-in-one desktop",
    image: "images/2002-imac-g4.jpg",
    caption: "Apple iMac G4 with its keyboard, mouse and speakers.",
    text: "On January 7, 2002, Apple introduced the new iMac with a 15-inch flat-panel screen on a movable chrome neck above a round white base. It had a PowerPC G4 processor at 700 or 800 MHz, and the top model included a SuperDrive that could read and write DVDs and CDs.",
    source: "Apple Newsroom, new iMac press release (January 7, 2002)",
    credit: { author: "Felix Winkelnkemper", license: "CC BY 2.0", link: "https://commons.wikimedia.org/wiki/File:Apple_iMac_G4_(32871160027).jpg" },
    theme: { title: "The Sunflower", wall: "#4d6a52", dark: "#354a39", accent: "#e8d9a0", frame: "#d9d2bd", pattern: "flowers" }
  },
  {
    year: 2003,
    blurb: "The Power Mac G5 used what Apple called the first 64-bit desktop processor.",
    name: "Apple Power Mac G5",
    type: "Desktop",
    image: "images/2003-power-mac-g5.jpg",
    caption: "Power Mac G5 in its aluminum case.",
    text: "On June 23, 2003, Apple introduced the Power Mac G5 with the PowerPC G5 processor, designed by IBM and Apple and described by Apple as the world's first 64-bit desktop processor. The top model had two 2.0 GHz processors and up to 8 GB of memory.",
    source: "Apple Newsroom, Power Mac G5 press release (June 23, 2003)",
    credit: { author: "Grm wnr", license: "CC BY-SA 3.0", link: "https://commons.wikimedia.org/wiki/File:Power_Mac_G5_hero_left.jpg" },
    theme: { title: "64-Bit Aluminum", wall: "#26324a", dark: "#182133", accent: "#d3d8df", frame: "#9fa5ad", pattern: "grille" }
  }
];
