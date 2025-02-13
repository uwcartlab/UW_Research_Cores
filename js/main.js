// Initialize the map
const map = L.map('map').setView([43.0731, -89.4012], 14);
let reset = false, suggestions = [];

// Add a tile layer (background map)
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '© OpenStreetMap contributors © CARTO',
  subdomains: 'abcd',
  maxZoom: 19
}).addTo(map);

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
          //create layer
          let buildings = L.geoJSON(json, {
            onEachFeature:function(feature,layer){
                function createDirectory(cores, bounds){
                    cores.forEach(function(obj){ 
                      //create popup list
                      let core = "";
                      core += "<div class='core-popup'><b>" + obj.Name + "</b>";
                      core += "<p>" + obj["Parent Organization"] + "</p>";
                      core += "<p>" + obj["Location"] + "</p></div>";
                      //create element
                      let directoryLink = document.createElement("div");
                      directoryLink.classList = ["directory-link"]
                      directoryLink.innerHTML = core;
                      //directory interactions
                      //click
                      directoryLink.addEventListener("click",function(elem){
                        reset = true, fullList = false;
                        map.fitBounds(bounds)
                        document.querySelector("#directory").innerHTML = "";
                        document.querySelector("#directory").insertAdjacentHTML("beforeend",core);
                        document.querySelector("#reset").style.display = "block";
                      })
                      //hover over
                      directoryLink.addEventListener("mouseover",function(elem){
                        layer.setStyle({
                          fillColor:"black"
                        })
                      })
                      //hover out
                      directoryLink.addEventListener("mouseout",function(elem){
                        buildings.resetStyle();
                      })
      
                      document.querySelector("#directory").insertAdjacentElement("beforeend",directoryLink)
                    })
                }
                //create layer bounds
                let bounds = layer.getBounds()
                //if there is more than one core in a building, add to the directory
                if (feature.properties.cores.length > 0){
                  createDirectory(feature.properties.cores,bounds)
                }
                //select layer
                layer.on("click",function(){
                  reset = true;
                  document.querySelector("#directory").innerHTML = "";
                  document.querySelector("#reset").style.display = "block";
                  map.fitBounds(bounds)
                  createDirectory(feature.properties.cores,bounds)
                })
                //reset button
                document.querySelector("#reset").addEventListener("click",function(){
                  if (reset == true){
                    document.querySelector("#directory").innerHTML = "";
                    document.querySelector("#reset").style.display = "none";
                    reset = false;
                    map.setView([43.0731, -89.4012], 14)
                  }
                  createDirectory(feature.properties.cores,bounds)
                })
            },
            filter:function(feature){
              let total_cores = 0,
                  cores = [];
              csv.forEach(function(c){
                  if (c.Building == Number(feature.properties.building_number) && c["Should this core be visible to the public?"] == 'Yes' ){
                    total_cores++;
                    suggestions.push(c.Name)
                    cores.push(c)
                  }
              })
              createSearchBar();

              feature.properties["total_cores"] = total_cores;
              feature.properties["cores"] = cores;
              
              let filter = total_cores > 0 ? true : false;
              return filter;
            },
            style: function(feature) {
              //let fill = feature.properties["total_cores"] > 10 ? "#2b8cbe" : feature.properties["total_cores"] > 5 ? "#a6bddb" : feature.properties["total_cores"] > 0 ? "#ece7f2":"#ffffff",
              let fill = "#ece7f2";   
                opacity = feature.properties["total_cores"] > 0 ? 0.9: 0,
                color = feature.properties["total_cores"] > 0 ?'blue': 'lightgray';

              return {
                color: color,
                weight: 1,
                fillColor: fill,
                fillOpacity: 0.9
              }
            }
          }).addTo(map);

      })
  }) 
.catch(error => console.error('Error fetching buildings list:', error));

function createSearchBar(){
  //search bar
  let search = document.getElementById("search-bar");
  let autocomplete = document.getElementById("suggestions");
  let currentFocus = -1; //To track the currently active suggestiom
  //input
  search.addEventListener("input",function(e){
      const query = e.target.value.toLowerCase();
      //Get user input and convert to lowercase for case-insensitive matching
      autocomplete.innerHTML = ""; //Clear previous autocomplete suggestions
      currentFocus = -1; //Reset the focus index when typing new input
      //If the input is empty dont show any suggestions
      if (!query) return;
      //Filter the countries based on user input
      const filteredSuggestions = suggestions.filter((suggestion) =>
        suggestion.toLowerCase().includes(query)
      ) 
      //Part 2:Create suggestions list dynamically
      filteredSuggestions.forEach((suggestion) => {
        const item = document.createElement("div");
        item.innerHTML = suggestion; //Set the suggestion text
        item.addEventListener("click", function () {
          search.value = suggestion;
          search.innerHTML = suggestion; //set the suggestion text
          autocomplete.innerHTML = ""; //Clear the suggestion list after selection
        });
        autocomplete.appendChild(item); //Add the suggestion to list
      });
  })
  //Part 3: handling keyboard navigation(arrow keys and enter)
  search.addEventListener("keydown", function (e) {
    let items = autocomplete.getElementsByTagName("div");
    //get all suggestions div elements
    if (e.key === "ArrowDown") {
      currentFocus++;
      highlightItem(items);
    } else if (e.key === "ArrowUp") {
      currentFocus--;
      highlightItem(items);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (currentFocus > -1 && items[currentFocus]) {
        items[currentFocus].click();
        }
      } 
  });
  //Part 4: Function to highlight the current item
  function highlightItem(items) {
    if (!items) return;
      removeActive(items);
    //Wrap focus withon the bounds of suggestion list
    if (currentFocus >= items.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = items.length - 1;
    items[currentFocus].classList.add("autocomplete-active");
  }
  //Part 5: Function to remove the active class from all items
  function removeActive(items) {
    for (let i = 0; i < items.length; i++) {
      items[i].classList.remove("autocomplete-active");
    }
  }
  //Part 6: close the autocomple list is the user click outite tje input field or list
  document.addEventListener("click", function (e) {
    if (!autocomplete.contains(e.target) && e.target !== search) {
      autocomplete.innerHTML = "";
    }
  });
}