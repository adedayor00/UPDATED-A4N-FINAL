# Builds src/lib/njCities.js: all 564 New Jersey municipalities.
# Source: Wikipedia county articles + county sites (September 2026).
# Names follow common usage; when a name repeats in different counties, the
# county is added in parentheses so renters can tell them apart.
import json, re
C = {
"Atlantic": "Absecon|Atlantic City|Brigantine|Buena|Buena Vista Township|Corbin City|Egg Harbor City|Egg Harbor Township|Estell Manor|Folsom|Galloway|Hamilton Township|Hammonton|Linwood|Longport|Margate City|Mullica Township|Northfield|Pleasantville|Port Republic|Somers Point|Ventnor City|Weymouth Township",
"Bergen": "Allendale|Alpine|Bergenfield|Bogota|Carlstadt|Cliffside Park|Closter|Cresskill|Demarest|Dumont|East Rutherford|Edgewater|Elmwood Park|Emerson|Englewood|Englewood Cliffs|Fair Lawn|Fairview|Fort Lee|Franklin Lakes|Garfield|Glen Rock|Hackensack|Harrington Park|Hasbrouck Heights|Haworth|Hillsdale|Ho-Ho-Kus|Leonia|Little Ferry|Lodi|Lyndhurst|Mahwah|Maywood|Midland Park|Montvale|Moonachie|New Milford|North Arlington|Northvale|Norwood|Oakland|Old Tappan|Oradell|Palisades Park|Paramus|Park Ridge|Ramsey|Ridgefield|Ridgefield Park|Ridgewood|River Edge|River Vale|Rochelle Park|Rockleigh|Rutherford|Saddle Brook|Saddle River|South Hackensack|Teaneck|Tenafly|Teterboro|Upper Saddle River|Waldwick|Wallington|Washington Township|Westwood|Woodcliff Lake|Wood-Ridge|Wyckoff",
"Burlington": "Bass River|Beverly|Bordentown|Bordentown Township|Burlington|Burlington Township|Chesterfield|Cinnaminson|Delanco|Delran|Eastampton|Edgewater Park|Evesham|Fieldsboro|Florence|Hainesport|Lumberton|Mansfield Township|Maple Shade|Medford|Medford Lakes|Moorestown|Mount Holly|Mount Laurel|New Hanover|North Hanover|Palmyra|Pemberton Borough|Pemberton Township|Riverside|Riverton|Shamong|Southampton|Springfield Township|Tabernacle|Washington Township|Westampton|Willingboro|Woodland Township|Wrightstown",
"Camden": "Audubon|Audubon Park|Barrington|Bellmawr|Berlin Borough|Berlin Township|Brooklawn|Camden|Cherry Hill|Chesilhurst|Clementon|Collingswood|Gibbsboro|Gloucester City|Gloucester Township|Haddon Heights|Haddon Township|Haddonfield|Hi-Nella|Laurel Springs|Lawnside|Lindenwold|Magnolia|Merchantville|Mount Ephraim|Oaklyn|Pennsauken|Pine Hill|Runnemede|Somerdale|Stratford|Tavistock|Voorhees|Waterford|Winslow|Woodlynne",
"Cape May": "Avalon|Cape May|Cape May Point|Dennis Township|Lower Township|Middle Township|North Wildwood|Ocean City|Sea Isle City|Stone Harbor|Upper Township|West Cape May|West Wildwood|Wildwood|Wildwood Crest|Woodbine",
"Cumberland": "Bridgeton|Commercial Township|Deerfield Township|Downe Township|Fairfield Township|Greenwich Township|Hopewell Township|Lawrence Township|Maurice River Township|Millville|Shiloh|Stow Creek Township|Upper Deerfield Township|Vineland",
"Essex": "Belleville|Bloomfield|Caldwell|Cedar Grove|East Orange|Essex Fells|Fairfield|Glen Ridge|Irvington|Livingston|Maplewood|Millburn|Montclair|Newark|North Caldwell|Nutley|Orange|Roseland|South Orange|Verona|West Caldwell|West Orange",
"Gloucester": "Clayton|Deptford|East Greenwich|Elk Township|Franklin Township|Glassboro|Greenwich Township|Harrison Township|Logan Township|Mantua Township|Monroe Township|National Park|Newfield|Paulsboro|Pitman|South Harrison Township|Swedesboro|Washington Township|Wenonah|West Deptford|Westville|Woodbury|Woodbury Heights|Woolwich Township",
"Hudson": "Bayonne|East Newark|Guttenberg|Harrison|Hoboken|Jersey City|Kearny|North Bergen|Secaucus|Union City|Weehawken|West New York",
"Hunterdon": "Alexandria Township|Bethlehem Township|Bloomsbury|Califon|Clinton|Clinton Township|Delaware Township|East Amwell|Flemington|Franklin Township|Frenchtown|Glen Gardner|Hampton|High Bridge|Holland Township|Kingwood Township|Lambertville|Lebanon|Lebanon Township|Milford|Raritan Township|Readington|Stockton|Tewksbury|Union Township|West Amwell",
"Mercer": "East Windsor|Ewing|Hamilton Township|Hightstown|Hopewell|Hopewell Township|Lawrence Township|Pennington|Princeton|Robbinsville|Trenton|West Windsor",
"Middlesex": "Carteret|Cranbury|Dunellen|East Brunswick|Edison|Helmetta|Highland Park|Jamesburg|Metuchen|Middlesex|Milltown|Monroe Township|New Brunswick|North Brunswick|Old Bridge|Perth Amboy|Piscataway|Plainsboro|Sayreville|South Amboy|South Brunswick|South Plainfield|South River|Spotswood|Woodbridge",
"Monmouth": "Aberdeen|Allenhurst|Allentown|Asbury Park|Atlantic Highlands|Avon-by-the-Sea|Belmar|Bradley Beach|Brielle|Colts Neck|Deal|Eatontown|Englishtown|Fair Haven|Farmingdale|Freehold|Freehold Township|Hazlet|Highlands|Holmdel|Howell|Interlaken|Keansburg|Keyport|Lake Como|Little Silver|Loch Arbour|Long Branch|Manalapan|Manasquan|Marlboro|Matawan|Middletown|Millstone Township|Monmouth Beach|Neptune City|Neptune Township|Ocean Township|Oceanport|Red Bank|Roosevelt|Rumson|Sea Bright|Sea Girt|Shrewsbury|Shrewsbury Township|Spring Lake|Spring Lake Heights|Tinton Falls|Union Beach|Upper Freehold|Wall|West Long Branch",
"Morris": "Boonton|Boonton Township|Butler|Chatham|Chatham Township|Chester|Chester Township|Denville|Dover|East Hanover|Florham Park|Hanover|Harding|Jefferson|Kinnelon|Lincoln Park|Long Hill|Madison|Mendham|Mendham Township|Mine Hill|Montville|Morris Plains|Morris Township|Morristown|Mount Arlington|Mount Olive|Mountain Lakes|Netcong|Parsippany-Troy Hills|Pequannock|Randolph|Riverdale|Rockaway|Rockaway Township|Roxbury|Victory Gardens|Washington Township|Wharton",
"Ocean": "Barnegat|Barnegat Light|Bay Head|Beach Haven|Beachwood|Berkeley Township|Brick|Eagleswood|Harvey Cedars|Island Heights|Jackson|Lacey|Lakehurst|Lakewood|Lavallette|Little Egg Harbor|Long Beach Township|Manchester|Mantoloking|Ocean Gate|Ocean Township|Pine Beach|Plumsted|Point Pleasant|Point Pleasant Beach|Seaside Heights|Seaside Park|Ship Bottom|South Toms River|Stafford|Surf City|Toms River|Tuckerton",
"Passaic": "Bloomingdale|Clifton|Haledon|Hawthorne|Little Falls|North Haledon|Passaic|Paterson|Pompton Lakes|Prospect Park|Ringwood|Totowa|Wanaque|Wayne|West Milford|Woodland Park",
"Salem": "Alloway Township|Carneys Point|Elmer|Elsinboro|Lower Alloways Creek|Mannington|Oldmans|Penns Grove|Pennsville|Pilesgrove|Pittsgrove|Quinton Township|Salem|Upper Pittsgrove|Woodstown",
"Somerset": "Bedminster|Bernards|Bernardsville|Bound Brook|Branchburg|Bridgewater|Far Hills|Franklin Township|Green Brook|Hillsborough|Manville|Millstone|Montgomery|North Plainfield|Peapack-Gladstone|Raritan|Rocky Hill|Somerville|South Bound Brook|Warren Township|Watchung",
"Sussex": "Andover|Andover Township|Branchville|Byram|Frankford|Franklin|Fredon|Green Township|Hamburg|Hampton Township|Hardyston|Hopatcong|Lafayette|Montague|Newton|Ogdensburg|Sandyston|Sparta|Stanhope|Stillwater|Sussex|Vernon|Walpack|Wantage",
"Union": "Berkeley Heights|Clark|Cranford|Elizabeth|Fanwood|Garwood|Hillside|Kenilworth|Linden|Mountainside|New Providence|Plainfield|Rahway|Roselle|Roselle Park|Scotch Plains|Springfield|Summit|Union|Westfield|Winfield",
"Warren": "Allamuchy|Alpha|Belvidere|Blairstown|Franklin Township|Frelinghuysen|Greenwich Township|Hackettstown|Hardwick|Harmony|Hope|Independence|Knowlton|Liberty|Lopatcong|Mansfield Township|Oxford|Phillipsburg|Pohatcong|Washington|Washington Township|White",
}
towns = [(n.strip(), c) for c, s in C.items() for n in s.split("|")]
assert len(towns) == 564, len(towns)
names = [n for n, _ in towns]
dup = {n for n in names if names.count(n) > 1}
base = lambda n: re.sub(r" (Township|Borough)$", "", n)
bases = [base(n) for n in names]
out = []
for n, c in towns:
    label = f"{n} ({c} County)" if n in dup else n
    out.append({"name": label, "county": c})
labels = [o["name"] for o in out]
assert len(set(labels)) == 564, [l for l in labels if labels.count(l) > 1]
out.sort(key=lambda o: o["name"].lower())
js = """// Every New Jersey municipality (564), for the city pickers and city pages.
// Generated by scripts/make-nj-towns.py. When a name exists in more than one
// county, the county is part of the name, e.g. "Franklin Township (Somerset County)".
export const NJ_TOWNS = %s;

export const NJ_CITIES = NJ_TOWNS.map((t) => t.name);
export const COUNTY_OF = Object.fromEntries(NJ_TOWNS.map((t) => [t.name, t.county]));
""" % json.dumps(out, indent=0, ensure_ascii=False).replace("\n", "")
open("src/lib/njCities.js", "w").write(js)
print(len(out), "towns;", len(dup), "repeated names get a county:", sorted(dup))
for t in ["Newark", "East Orange", "Maplewood", "Irvington", "Jersey City", "Elizabeth", "Nutley"]:
    assert t in labels, t
