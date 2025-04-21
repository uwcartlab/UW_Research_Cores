// Initialize the map
const map = L.map('map').setView([43.0731, -89.4012], 14);
let reset = false, directory = [], view = [43.0731, -89.4012], zoom = 14;

// Add a tile layer (background map)
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '© OpenStreetMap contributors © CARTO',
  subdomains: 'abcd',
  maxZoom: 19
}).addTo(map);
//zoom buttons
document.querySelector("#madison").addEventListener("click",function(){
    view = [43.0731, -89.4012];  
    zoom = 14;
    map.flyTo(view, zoom);
})
document.querySelector("#wisconsin").addEventListener("click",function(){
    view = [44.708, -90.406]; 
    zoom = 7; 
    map.flyTo(view, zoom);
})
//get building data
fetch('data/buildings.geojson')
  .then(res => res.json())
  .then(json =>{
      let csv;
      //load cores report csv
      fetch("data/CoresReport.csv")
        .then(res => res.text())
        .then(data => {
          //parse csv
          data = Papa.parse(data,{
              header:true
          }).data;
          csv = data;
          //create building layer layer
          let buildings = L.geoJSON(json, {
            filter:function(feature){
              //create variables for core list for each building
              let total_cores = 0, cores = [];
              //loop through core csv
              csv.forEach(function(c){
                //check if core building code matches building code
                  if (c.Building == Number(feature.properties.building_number) && c["Should this core be visible to the public?"] == 'Yes' ){
                    //add total cores to list
                    total_cores++;
                    //add building name to overall directory list
                    directory.push(c.Name)
                    //add core data to cores list
                    cores.push(c)
                  }
              })
              //create the search bar and enable interaction
              createSearchBar(csv);
              //add total core number and core list to geojson
              feature.properties["total_cores"] = total_cores;
              feature.properties["cores"] = cores;
              //filter out buildings with no cores attached
              let filter = total_cores > 0 ? true : false;
              return filter;
            },
            onEachFeature:function(feature,layer){
              //function to create the list of cores
                function createDirectory(cores, bounds){
                    cores.forEach(function(obj){ 
                      //create html for the core directory
                      let core = "";
                      core += "<div class='core-popup'><b>" + obj.Name + "</b>";
                      core += "<p>" + obj["Parent Organization"] + "</p>";
                      core += "<p>" + obj["Location"] + "</p></div>";
                      //create element for the directory item
                      let directoryLink = document.createElement("div");
                      directoryLink.classList = ["directory-link"];
                      directoryLink.id = obj.Name.replace(/\s|\W/g, '');
                      directoryLink.innerHTML = core;
                      //directory interactions
                      //click on directory item
                      directoryLink.addEventListener("click",function(elem){
                        //enable reset button
                        reset = true
                        document.querySelector("#reset").style.display = "block";
                        //zoom to building
                        console.log(bounds)
                        if (feature.geometry.type != 'Point')
                          map.fitBounds(bounds)
                        else{
                          let latlng = L.latLng(bounds[1], bounds[2])
                          map.flyTo(latlng)
                        }
                        //clear directory of additional cores
                        document.querySelector("#directory").innerHTML = "";
                        //display current core's information
                        document.querySelector("#directory").insertAdjacentHTML("beforeend",core);
                      })
                      //hover over directory item coordinated viz
                      directoryLink.addEventListener("mouseover",function(){
                        //highlight associated building
                        if (feature.geometry.type != "Point"){
                          layer.setStyle({
                            color:"black",
                            weight:2.5
                          })
                        }
                      })
                      //hover out
                      directoryLink.addEventListener("mouseout",function(elem){
                        //reset building style
                        buildings.resetStyle();
                      })
                      
                      document.querySelector("#directory").insertAdjacentElement("beforeend",directoryLink)
                    })
                }
                let bounds
                //create layer bounds
                if (feature.geometry.type == "Point"){
                  bounds = feature.geometry.coordinates
                }
                else {
                  bounds = layer.getBounds()
                }
                //if there is more than one core in a building, add to the directory
                if (feature.properties.cores.length > 0 && feature.geometry.type != "Point"){
                  createDirectory(feature.properties.cores,bounds)
                }
                //select buildings
                layer.on("click",function(){
                  //activate reset button
                  reset = true;
                  document.querySelector("#reset").style.display = "block";
                  //clear directory
                  document.querySelector("#directory").innerHTML = "";
                  //zoom to building
                  console.log(bounds)
                  if (feature.geometry.type != 'Point')
                    map.fitBounds(bounds)
                  else{
                    let latlng = L.latLng([bounds[1], bounds[0]])
                    map.flyTo(latlng)
                  }

                  //create directory for cores in selected building
                  createDirectory(feature.properties.cores,bounds)
                })
                //reset button
                document.querySelector("#reset").addEventListener("click",function(){
                  //if reset is activated
                  if (reset == true){
                    //clear directory
                    document.querySelector("#directory").innerHTML = "";
                    //remove and deactivate reset button
                    document.querySelector("#reset").style.display = "none";
                    reset = false;
                    //clear search button
                    document.querySelector("#search").value = "";
                    //set map view to original 
                    map.setView(view, zoom)
                  }
                  //create full directory
                  createDirectory(feature.properties.cores,bounds)
                })
            },
            //style map
            style: function(feature) {
              return {
                color: "rgb(197, 5, 12)",
                weight: 1,
                fillColor: "rgb(197, 5, 12)",
                fillOpacity: 0.5
              }
            }
          }).addTo(map);

      })
  }) 
//create search bar and add functionality
function createSearchBar(csv){
  //get search bar element
  let search = document.getElementById("search-bar");
  //input element
  search.addEventListener("input",function(e){
    //if search bar is black, reveal full directory list
    if (e.target.value.length == 0){
      document.querySelectorAll(".directory-link").forEach(function(elem){
        elem.style.display = "block"
      })
    }  
    //get search query value
    const query = e.target.value.toLowerCase();
      //hide all directory items
      document.querySelectorAll(".directory-link").forEach(function(elem){
        elem.style.display = "none"
      })
      //Filter the directory values based on user input
      const filteredSuggestions = directory.filter((item) =>
        item.toLowerCase().includes(query)
      ) 
      //filter directory list dynamically
      filteredSuggestions.forEach((suggestion) => {
        const item = document.createElement("div");
        item.innerHTML = suggestion; //Set the suggestion text

        let currentClass = suggestion.replace(/\s|\W/g, '');
        if (document.querySelector("#" + currentClass)){
          document.querySelector("#" + currentClass).style.display = "block";
        }
      });
  })
  
}