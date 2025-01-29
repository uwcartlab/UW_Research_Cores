// Initialize the map
const map = L.map('map').setView([43.0731, -89.4012], 14);

// Add a tile layer (background map)
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '© OpenStreetMap contributors © CARTO',
  subdomains: 'abcd',
  maxZoom: 19
}).addTo(map);

let geojson = {
  type:"FeatureCollection",
  name:"buildings",
  features:[]
}

// Fetch the list of all buildings
fetch('https://map.wisc.edu/api/v1/buildings') // Fetch building data
  .then(response => {
    if (!response.ok) {
      throw new Error(`Failed to fetch building list: ${response.statusText}`);
    }
    return response.json();
  })
  .then(data => {
    //console.log("Buildings data fetched:", data);
    let length = data.length - 1;
    // Iterate over all buildings
    data.forEach(function(building,i){
      const building_number = building.building_number;
      if (building_number) {
        let address = `https://map.wisc.edu/api/v1/buildings/${building_number}.geojson`
      
      // Check if building_number is valid
        // Fetch the GeoJSON for this building from your Node server
        fetch(`https://map.wisc.edu/api/v1/buildings/${building_number}.geojson`) // Request backend endpoint with .geojson
          .then(res => {
            if (!res.ok) {
              console.error(`Building ${building_number} not found (status: ${res.status})`);
              return null; // Skip this building
            }
            return res.json();
          })
          .then(json => {
            //console.log(json)
            if (json){
              //geojson template
              let obj = {}
              //set feature type
              obj.type = "Feature";
              //add geometry 
              obj.geometry = {
                type:json.geojson.type,
                coordinates:json.geojson.coordinates
              }
              obj.properties = json;

              geojson.features.push(obj)
            }
          })
          .then(test =>{
            if (length == i){
                console.log(geojson)
                let layer = L.geoJSON(geojson, {
                  onEachFeature:function(feature,layer){
                    console.log(feature.properties)
                    //L.popup("Test").bindToFeature();
                  },
                  style: {
                    color: 'blue',
                    weight: 1,
                    fillColor: 'gray',
                    fillOpacity: 0.5
                  }
                }).addTo(map);
                console.log(layer)
            }
          })
            
            /*if (geojson) {
              // Add the building polygon to the map
              L.geoJSON(geojson, {
                style: {
                  color: 'blue',
                  weight: 1,
                  fillColor: 'gray',
                  fillOpacity: 0.5
                }
              }).addTo(map);
            }*/
          .catch(err => console.error(`Error fetching GeoJSON for building ${building_number}:`, err));
      } else {
        console.warn(`Invalid building number: ${building_number}`);
      }
    });
  })
  .catch(error => console.error('Error fetching buildings list:', error));