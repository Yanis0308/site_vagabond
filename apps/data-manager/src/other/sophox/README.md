# Requêtes Sophox

https://sophox.org/

## 1. Points touristiques

```sparql
SELECT DISTINCT ?osmId ?name ?tourism_type ?religion ?denomination ?wp ?wd
  ?wdLabel ?image ?website ?description ?coordinates
WHERE {
  {
    # Points touristiques
    ?osmId osmt:name ?name ;
    osmt:tourism ?tourism_type .
    FILTER(?tourism_type NOT IN (
      "hotel",
      "caravan_site",
      "guest_house",
      "camp_pitch",
      "picnic_site",
      "hostel",
      "apartment",
      "camping",
      "chalet",
      "motel",
      "wilderness_hut",
      "alpine_hut",
      "camp_site"
    ))
  }

  UNION
  {
    # Lieux de culte
    ?osmId osmt:amenity "place_of_worship" ;
           osmt:name ?name .
    OPTIONAL { ?osmId osmt:religion ?religion }
    OPTIONAL { ?osmId osmt:denomination ?denomination }
  }

  # Propriétés communes
  OPTIONAL { ?osmId osmt:wikipedia ?wp }
  OPTIONAL {
    ?osmId osmt:wikidata ?wd .

    # Récupération des données Wikidata
    SERVICE <https://query.wikidata.org/sparql> {
      OPTIONAL {
        ?wd rdfs:label ?wdLabel .
        FILTER(LANG(?wdLabel) = "fr")
      }
      OPTIONAL { ?wd wdt:P18 ?image }
      OPTIONAL { ?wd wdt:P856 ?website }
      OPTIONAL {
        ?wd schema:description ?description .
        FILTER(LANG(?description) = "fr")
      }
    }
  }

  # Filtre géographique
  SERVICE wikibase:box {
    ?osmId osmm:loc ?coordinates.

    bd:serviceParam wikibase:cornerSouthWest "Point(1.4631127432982112 49.510288922060084)"^^geo:wktLiteral.
    bd:serviceParam wikibase:cornerNorthEast "Point(4.344115221610963 51.04343355589475)"^^geo:wktLiteral.
  }
}
LIMIT 1000
OFFSET 1000
```

## 2. Count pour la requête 1

- Il faut réduire la zone géographique pour que la requête soit possible

```sparql
SELECT (COUNT(DISTINCT ?osmId) as ?total)
WHERE {
  {
    # Points touristiques
    ?osmId osmt:name ?name ;
    osmt:tourism ?tourism_type .
    FILTER(?tourism_type NOT IN (
      "hotel", "caravan_site", "guest_house", "camp_pitch", "picnic_site",
      "hostel", "apartment", "camping", "chalet", "motel",
      "wilderness_hut", "alpine_hut", "camp_site"
    ))
  }
  UNION
  {
    # Lieux de culte
    ?osmId osmt:amenity "place_of_worship" ;
           osmt:name ?name .
  }

  # Filtre géographique avec zone plus petite
  SERVICE wikibase:box {
    ?osmId osmm:loc ?coordinates.

    bd:serviceParam wikibase:cornerSouthWest "Point(3.015448482714305 50.60681745662211)"^^geo:wktLiteral.
    bd:serviceParam wikibase:cornerNorthEast "Point(4.103379981024432 51.65840509389264)"^^geo:wktLiteral.
  }
}
```
