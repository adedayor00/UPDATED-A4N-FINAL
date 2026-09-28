// A well-known landmark for each city we cover, used on city tiles and city pages.
// All photos are from Wikimedia Commons under free licenses; credits are shown on
// /photo-credits (linked from the footer) (required by CC BY / CC BY-SA). Images load straight from
// Wikimedia at a reduced width, so nothing is copied into this repo.
// Pure module (no React, no "@/" imports) so Node scripts can use it.

const RAW = {
  Newark: ["Newark Penn Station", "Newark Penn Station June 2015 002.jpg", "King of Hearts", "CC BY-SA 4.0"],
  Irvington: ["Christ Anglican Church", "Christ Anglican Church, Irvington, New Jersey 01.jpg", "Dclemens1971", "CC BY 4.0"],
  "East Orange": ["East Orange City Hall", "East Orange City Hall straight jeh.jpg", "Jim.henderson", "Public domain"],
  Elizabeth: ["Union County Courthouse", "Union county courthouse in Elizabeth New Jersey.jpg", "Tomwsulcer", "CC0"],
  "Jersey City": [
    "Jersey City skyline",
    "Jersey City skyline with the Colgate Clock, Jersey City, New Jersey.jpg",
    "Christian David",
    "CC BY-SA 4.0",
  ],
  Paterson: ["Great Falls of the Passaic", "Great Falls of Paterson 2016.jpg", "FirozAnsari", "CC BY-SA 4.0"],
  Maplewood: ["Maplewood Municipal Building", "Maplewood Municipal Bldg jeh.JPG", "Jim.henderson", "Public domain"],
  Rahway: [
    "Hamilton Stage for the Performing Arts",
    "Hamilton Stage for the Performing Arts in Rahway, New Jersey.jpg",
    "Wlazeus2",
    "CC BY-SA 4.0",
  ],
  "Union City": [
    "Manhattan skyline from Union City",
    "New York City skyline views from Union City, New Jersey 01.jpg",
    "The Eloquent Peasant",
    "CC0",
  ],
  "West Orange": [
    "Thomas Edison National Historical Park",
    "Thomas Edison NHP entrance NJ1.jpg",
    "Acroterion",
    "CC BY-SA 4.0",
  ],
  Woodbridge: ["Barron Arts Center", "Barron Arts Center.jpg", "Imageg", "CC BY-SA 3.0"],
};

const filePath = (file, width) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${width}`;

export function cityPhoto(city, width = 800) {
  const r = RAW[city];
  if (!r) return null;
  const [landmark, file, author, license] = r;
  return {
    city,
    landmark,
    src: filePath(file, width),
    srcSet: `${filePath(file, 480)} 480w, ${filePath(file, 960)} 960w`,
    author,
    license,
    source: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replace(/ /g, "_"))}`,
  };
}

export const CITY_PHOTOS = Object.keys(RAW).map((c) => cityPhoto(c));
