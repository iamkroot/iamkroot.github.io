type Status = "active" | "passive" | "archived" | "maintenance";

interface Projects {
  title: string
  description: string
  href?: string
  imgSrc?: string
  status: Status
}

const projectsData: Projects[] = [
  {
    title: 'Trakt Scrobbler',
    description: `Python application that automatically recognizes the currently playing media on your PC and syncs that information with Trakt.tv servers.`,
    href: 'https://github.com/iamkroot/trakt-scrobbler',
    status: 'maintenance',
  },
  {
    title: 'ILC Scraper',
    description: 'Video stream downloader for the Impartus platform',
    href: 'https://github.com/iamkroot/ilc-scraper',
    status: 'archived',
  },
  {
    title: 'YAAI',
    description: 'Yet Another Aria2 Integrator - Use aria2 to intercept Firefox downloads",
    href: 'https://github.com/iamkroot/yaai',
    status: 'passive',
  },
  {
    title: 'ked',
    description: 'A Text Editor',
    href: 'https://github.com/iamkroot/ked',
    status: 'passive',
  },
  {
    title: 'Asus Numpad',
    description: 'Linux driver for Asus laptops to activate numpad on touchpad',
    href: 'https://github.com/iamkroot/asus-numpad/',
    imgSrc: 'https://repository-images.githubusercontent.com/428760479/35fc15fd-580e-4c97-a0de-eac87f97b983',
    status: 'maintenance',
  },
  {
    title: 'clox',
    description: 'Bytecode VM for the Lox language as covered in the book Crafting Interpreters',
    href: 'https://github.com/iamkroot/clox',
    status: 'archived',
  },
  {
    title: 'pyTAPL',
    description: ' Implementations of various systems as described in Types and Programming Languages book, in Python 3.10',
    href: 'https://github.com/iamkroot/pytapl',
    status: 'archived',
  },
  {
    title: 'JS Userscripts',
    description: 'Custom Tampermonkey scripts to make my web browsing more bearable',
    href: 'https://github.com/iamkroot/js-userscripts',
    status: 'passive',
    imgSrc: 'https://avatars.githubusercontent.com/u/13335464?s=400&v=4',
  },
  {
    title: 'Misc Scripts',
    description: 'Miscellaneous one-off scripts',
    href: 'https://github.com/iamkroot/misc-scripts',
    status: 'passive',
  },
  {
    title: 'MoonReader Py',
    description: 'Collection of scripts for extracting and parsing library databases from the Moon+ Reader android app backups',
    href: 'https://github.com/iamkroot/moonreader-py',
    status: 'passive',
  },
  {
    title: 'Advent of Code 2022',
    description: "[Advent of Code](https://adventofcode.com/2022/) solutions in Zig",
    href: 'https://github.com/iamkroot/aoc22-zig',
    status: 'archived',
  },
  {
    title: 'ERP GCal',
    description: 'Add your course schedule to a Google calendar',
    href: 'https://github.com/iamkroot/erp-gcal',
    status: 'archived',
  }
]

export default projectsData
