// Connect page to mapbox style
mapboxgl.accessToken =
  'pk.eyJ1Ijoid2F3YXNpdGEiLCJhIjoiY2sydGNyYXhyMHFoNTNtcDV3ZDNyZzBlaCJ9.Wju2Qb9nehYepXQAUFuxmg';
const map = new mapboxgl.Map({
  container: 'map', // container ID
  style: 'mapbox://styles/wawasita/cl6g21ffh000m14rtj98ffsig', // style URL
  center: [100.45, 14.05], // starting position [lng, lat]
  zoom: 8.25, // starting zoom (0 {world scale} to 22)
  //control min-max zoom level on website
  maxZoom: 15,
  minZoom: 4,
  pitch: 60, // pitch in degrees
  //bearing: -60, // bearing in degrees
  projection: 'mercator', // display the map as a 3D globe only two possibility globe or mercator
});

// Set map atmosphere style. if not familiar with the result, play in the studio first then copy the attibute to JS
map.on('style.load', () => {
  map.setFog({
    range: [0.5, 10],
    'horizon-blend': 0.1,
    color: 'white',
    'high-color': '#dbdbdb',
    'space-color': '#dedede',
    'star-intensity': 0.0,
  });
});

//Tools over the map
// disable map zoom when using scroll
//map.scrollZoom.disable();
map.addControl(new mapboxgl.ScaleControl());

// Add the control to the map.
map.addControl(
  new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl,
  })
);

//to control the position, use const to introduce the fuction first then, add control later
const draw = new MapboxDraw({
  // turn off the default setting
  displayControlsDefault: false,
  // Select which mapbox-gl-draw control buttons to add to the map.
  controls: {
    point: true,
    polygon: true,
    line_string: true,
    trash: true,
  },
  // Set mapbox-gl-draw to draw by default.
  // The user does not have to click the line control button first.
  //defaultMode: 'draw_line_string'
});
map.addControl(draw, 'bottom-right');

const navigation = new mapboxgl.NavigationControl();
map.addControl(navigation, 'bottom-right');
// the order of script effect the arrangement of elements

// Give the distance function by introducing turf
// clear value everytime the geometry changes
map.on('draw.create', updateArea);
map.on('draw.delete', updateArea);
map.on('draw.update', updateArea);

function updateArea(e) {
  const data = draw.getAll();
  const answer = document.getElementById('calculated-distance');
  if (data.features.length > 0) {
    const length = turf.length(data);
    // Restrict the area to 2 decimal points.
    const rounded_length = Math.round(length * 100) / 100;
    answer.innerHTML = `<p><strong>Distance : ${rounded_length}</strong> km</p>`;
  } else {
    answer.innerHTML = '';
    if (e.type !== 'draw.delete') alert('Click the map to draw a polygon.');
  }
}
var styleList = document.getElementById('Background');
var inputs = styleList.getElementsByTagName('input');

//Calculation parameters, filter for cluster calculation
// filters for classifying earthquakes into five categories based on magnitude
const sc1 = ['<', ['get', 'ScoreMean'], 1.6];
const sc2 = ['all', ['>=', ['get', 'ScoreMean'], 1.6], ['<', ['get', 'ScoreMean'], 2.3]];
const sc3 = ['>=', ['get', 'ScoreMean'], 2.3];

// colors to use for the categories
const colors = ['#7a871e', '#4b5057', '#250061'];

//Add layer and customize the visualization
function addSource() {
  //add data
  map.addSource('Score', {
    type: 'vector', // click on selected tileset in studio to check type of layer on the top-left
    // Use any Mapbox-hosted tileset using its tileset id.
    // Learn more about where to find a tileset id:
    // https://docs.mapbox.com/help/glossary/tileset-id/ url: = 'mapbox://+ tileset id'
    url: 'mapbox://wawasita.3blo9xwu',
  });

  map.addSource('Factory', {
    type: 'vector',
    url: 'mapbox://wawasita.5dw5t9fb',
  });

  map.addSource('BKK_Logistic', {
    type: 'vector',
    url: 'mapbox://wawasita.3yfhu1qb',
  });

  map.addSource('stations', {
    type: 'vector',
    url: 'mapbox://wawasita.5lc4rp7t',
  });

  map.addSource('case', {
    type: 'vector',
    url: 'mapbox://wawasita.5xfj5f59',
  });

  map.addSource('sc_cir', {
    type: 'geojson',
    data: 'https://raw.githubusercontent.com/wawasita/ThailandBambooBelt/c02971a82857aef8e728f1d1b857064ef98b1216/GEE_Score_All_point_ex_5d.geojson',
    cluster: true,
    clusterRadius: 256,
    clusterProperties: {
      // keep separate counts for each score category in a cluster
      sc1: ['+', ['case', sc1, ['get', 'Area'], 0]],
      sc2: ['+', ['case', sc2, ['get', 'Area'], 0]],
      sc3: ['+', ['case', sc3, ['get', 'Area'], 0]],
    },
  });
}


function addLayer() {
  map.addLayer({
    id: 'Suitable area to grow bamboo', // Define the Layer name in the script can be anything, not related to studio
    type: 'fill', // type fill, line, circle, fill-extrude link to layer > Select data > type in studio
    source: 'Score', // id from addSource
    // for studio upload the soruce-layer must be identify, but the api one does not require
    'source-layer': 'GEE_Score-6pxqcf', // click on tileset in studio to check layer name on the top-left
    // layout defines how the Mapbox GL renderer draws and applies data for a layer : line, text, symbol
    layout: {},
    // paint defines how data in layer is styled
    // both paint and layout use the same expression such as interpolate / match https://docs.mapbox.com/help/glossary/layout-paint-property/
    // style identification https://docs.mapbox.com/mapbox-gl-js/style-spec/layers/ can use the studio as the parameter experiment
    paint: {
      'fill-color': [
        'interpolate',
        ['linear'],
        ['get', 'ScoreMean'], // tell the render to pick the data from 'properties' which is identify on the tileset
        1.4,
        '#b3ae25',
        3,
        '#37355C',
      ],
      'fill-opacity': 0.5,
      'fill-outline-color': '#0d237d',
    },
  });

  const {MapboxLayer, ScatterplotLayer, ArcLayer} = deck;
  map.addLayer(new MapboxLayer({
      id: 'Case Illustration',
      type: ArcLayer,
      data: 'https://raw.githubusercontent.com/wawasita/wawasita.github.io/main/case_sheet.json',
      pickable: true,
      getSourcePosition: d => [d.s_lng, d.s_lat],
      getTargetPosition: d => [d.t_lng, d.t_lat],
      // getTargetPosition: d => [d.home_lng, d.home_lat],
      getSourceColor: d => d.s_color,
      getTargetColor: d => d.t_color,
      getWidth: 3,
      getHeight: d => 1/(1.5*d.size)
    }));

  map.addLayer({
    id: 'Suitable area for primary factory',
    type: 'fill-extrusion',
    source: 'Score',
    'source-layer': 'GEE_Score-6pxqcf',
    //mixzoom: 8.5,
    layout: {},
    //to filter the range
    filter: ['>=', 'PriFactory', 368],
    paint: {
      'fill-extrusion-color': [
        'interpolate',
        ['linear'],
        ['get', 'PriFactory'],
        300,
        '#fafcee',
        400,
        '#aacfae',
        700,
        '#001670',
      ],
      'fill-extrusion-height': [
        'interpolate',
        ['linear'],
        ['zoom'],
        0,
        ['*', ['get', 'PriFactory'], 20],
        //to operate the mathamatic expression [ operation, number, number]
        15,
        ['*', ['get', 'PriFactory'], 0.5],
      ],
      'fill-extrusion-base': [
        'interpolate',
        ['linear'],
        ['zoom'],
        0,
        ['*', ['get', 'PriFactory'], 15],
        12,
        0,
      ],
      'fill-extrusion-opacity': ['interpolate', ['linear'], ['zoom'], 8, 0.75, 14, 0.25],
    },
  });

  map.addLayer({
    id: 'Suitable area for primary factory_Z0',
    type: 'fill-extrusion',
    source: 'Factory',
    'source-layer': 'Factory_Area',
    maxzoom: 8.26,
    layout: {},
    //to filter the range
    filter: ['>=', 'label', 368],
    paint: {
      'fill-extrusion-color': [
        'interpolate',
        ['linear'],
        ['get', 'label'],
        300,
        '#fafcee',
        400,
        '#aacfae',
        700,
        '#001670',
      ],
      'fill-extrusion-height': [
        'interpolate',
        ['linear'],
        ['zoom'],
        0,
        ['*', ['get', 'label'], 20],
        //to operate the mathamatic expression [ operation, number, number]
        15,
        ['*', ['get', 'label'], 0.5],
      ],
      'fill-extrusion-base': [
        'interpolate',
        ['linear'],
        ['zoom'],
        0,
        ['*', ['get', 'label'], 15],
        12,
        0,
      ],
      'fill-extrusion-opacity': ['interpolate', ['linear'], ['zoom'], 0, 0.9, 8.5, 0.75],
    },
  });

  map.addLayer({
    id: 'Suitable area for transportation to urban fabric',
    //type can be "fill", "line", "symbol", "circle", "heatmap", "fill-extrusion", "raster", "hillshade", "background", "sky".
    type: 'fill',
    source: 'BKK_Logistic',
    'source-layer': 'Trasportation_BKK-c8w6ma',
    layout: {},
    paint: {
      'fill-color': ['interpolate', ['linear'], ['get', 'Score'], 1, '#bababa', 3, '#949494'],
      'fill-opacity': 0.4,
      'fill-outline-color': 'black', //cannot control the thickness
    },
  });


  map.addLayer({
    id: 'Case Description',
    type: 'symbol',
    source: 'case',
    'source-layer': 'case_points-448omy',
    minzoom: 4,
    layout: {
      'text-field': ['get', 'Name'],
      //only mapbox font, in case want personal font then upload font on mapbox style
      'text-font': ['DIN Pro Regular'],
      'text-size': 10,
      'text-offset': [0, 1.25],
      'text-anchor': 'top',
      //add the icon svg 15x15px in the map style
      //color the icon - https://docs.mapbox.com/help/troubleshooting/using-recolorable-images-in-mapbox-maps/
      //customize icon-image and size according to data
      'icon-image': [
        'match',
        ['get', 'Type'],
        1,
        'LCA-01',
        2,
        'LCA-02',
        3,
        'LCA-03',
        4,
        'LCA-04',
        /* other */ 'dot-11',
      ],
      'icon-size': 1.25
    },
    paint: {
      'text-opacity': 0.8,
      'icon-opacity': 1,
    },
  });


  map.addLayer({
    id: 'Train Station',
    type: 'symbol',
    source: 'stations',
    'source-layer': 'Station_point-7pkx0z',
    minzoom: 5,
    layout: {
      'text-field': ['get', 'name'],
      //only mapbox font, in case want personal font then upload font on mapbox style
      'text-font': ['DIN Pro Regular'],
      'text-size': ['match', ['get', 'class'], 1, 10, 11, 10, /* other */ 0],
      'text-offset': [0, 1.25],
      'text-anchor': 'top',
      //add the icon svg 15x15px in the map style
      //color the icon - https://docs.mapbox.com/help/troubleshooting/using-recolorable-images-in-mapbox-maps/
      //customize icon-image and size according to data
      'icon-image': [
        'match',
        ['get', 'class'],
        1,
        'icon-train-15-g',
        11,
        'icon-train-15-g',
        /* other */ 'dot-11',
      ],
      'icon-size': ['match', ['get', 'class'], 1, 0.8, 11, 1, /* other */ 0.6],
    },
    paint: {
      'text-opacity': 0.8,
      'icon-color': 'red',
      'icon-opacity': 1,
      //['match', ['get', 'class'], 1,0.8, 11,1, /* other */ 0.4]
    },
  });

  // circle and symbol layers for rendering individual earthquakes (unclustered points)
  map.addLayer({
    id: 'sc_circle',
    type: 'circle',
    source: 'sc_cir',
    filter: ['!=', 'cluster', true],
    paint: {
      'circle-color': ['interpolate', ['linear'], ['get', 'Area'], 0, '#7a871e', 3, '#250061'],
      'circle-opacity': 0,
      'circle-radius': ['+', ['*', ['get', 'Area'], 1], 12],
    },
  });
  /*map.addLayer({
    'id': 'sc_label',
    'type': 'symbol',
    'source': 'sc_cir',
    'filter': ['!=', 'cluster', true],
    'layout': {
        'text-field': 
        [
          
          'number-format', ['get', 'ScoreMean'],
           // 'number-format', ['*', ['get', 'ScoreMean'], ['get', 'Area'],8],
            { 'min-fraction-digits': 1, 'max-fraction-digits': 1 }
        ],
        'text-font': ['DIN Pro Bold'],
        'text-size': 0
    },
    'paint': {
        'text-color': 'white'
    }
});*/
}
let isDonutShow = false;
document.getElementById('button1').addEventListener('click', () => {
  const elements = document.getElementsByClassName('marker-container');

  for (let i = 0; i < elements.length; i++) {
    if (!isDonutShow) {
      elements[i].classList.add('active');
    } else {
      elements[i].classList.remove('active');
    }
  }
  isDonutShow = !isDonutShow;
});

map.on('load', () => {
  // add a clustered GeoJSON source for a sample set of earthquakes
  // objects for caching and keeping track of HTML marker objects (for performance)
  const markers = {};
  let markersOnScreen = {};

  function updateMarkers() {
    const newMarkers = {};
    const features = map.querySourceFeatures('sc_cir');

    // for every cluster on the screen, create an HTML marker for it (if we didn't yet),
    // and add it to the map if it's not there already
    for (const feature of features) {
      const coords = feature.geometry.coordinates;
      const props = feature.properties;

      if (!props.cluster) continue;
      const id = props.cluster_id;

      let marker = markers[id];
      if (!marker) {
        const { el, total } = createDonutChart(props);
        marker = markers[id] = new mapboxgl.Marker({
          element: el,
        }).setLngLat(coords);

        // *Ky add* - hover pop-up
        const popupContainer = document.getElementById('donut-popup-container');
        el.addEventListener('mouseover', () => {
          popupContainer.style.display = 'block';
          const popupInnerHtml = `
            <p>Possible area : ${total} sqkm.<br>
            Annual bamboo production: ${Math.round(total * 2316)} tonnes <br>
            Annual CO2 capture : ${Math.round(total * 93)} tonnes <br>
            Bamboo Material after processed : ${Math.round(total * 2316 * 0.3)} tonnes <br>
            Number of housing units (50% bamboo): ${Math.round(total * 34 * 0.3)} units <br>
            </p>
          `;
          popupContainer.innerHTML = popupInnerHtml;
        });
        el.addEventListener('mouseout', () => {
          popupContainer.style.display = 'none';
        });
      }
      newMarkers[id] = marker;

      if (!markersOnScreen[id]) marker.addTo(map);
    }
    // for every marker we've added previously, remove those that are no longer visible
    for (const id in markersOnScreen) {
      if (!newMarkers[id]) markersOnScreen[id].remove();
    }
    markersOnScreen = newMarkers;
  }

  // after the GeoJSON data is loaded, update markers on the screen on every frame
  map.on('render', () => {
    if (!map.isSourceLoaded('sc_cir')) return;
    updateMarkers();
  });
});

// code for creating an SVG donut chart from feature properties
function createDonutChart(props) {
  const offsets = [];
  const counts = [props.sc1, props.sc2, props.sc3];
  let total = 0;
  for (const count of counts) {
    offsets.push(total);
    total += count;
  }
  const fontSize = total >= 10000 ? 16 : total >= 5000 ? 14 : total >= 10 ? 12 : 10;
  const r = total >= 100000 ? 48 : total >= 10000 ? 40 : total >= 5000 ? 32 : total >= 10 ? 24 : 18;

  const r0 = Math.round(r * 0.7);
  const w = r * 2;

  let html = `<div>
      <svg width="${w}" height="${w}" viewbox="0 0 ${w} ${w}" text-anchor="middle" style="font: ${fontSize}px sans-serif; display: block">`;

  for (let i = 0; i < counts.length; i++) {
    html += donutSegment(offsets[i] / total, (offsets[i] + counts[i]) / total, r, r0, colors[i]);
  }
  html += `<circle cx="${r}" cy="${r}" r="${r0}" fill="white" />
      <text dominant-baseline="central" transform="translate(${r}, ${r})">
          ${total.toLocaleString()}
      </text>
      </svg>
      </div>`;

  // *Ky add* to call out the elements and total number
  const donutContainer = document.createElement('div');
  donutContainer.innerHTML = html;

  const el = document.createElement('div');
  el.classList.add('marker-container');
  el.appendChild(donutContainer);
  if (isDonutShow) {
    el.classList.add('active');
  }

  return { el: el, total: total };
}

function donutSegment(start, end, r, r0, color) {
  if (end - start === 1) end -= 0.00001;
  const a0 = 2 * Math.PI * (start - 0.25);
  const a1 = 2 * Math.PI * (end - 0.25);
  const x0 = Math.cos(a0),
    y0 = Math.sin(a0);
  const x1 = Math.cos(a1),
    y1 = Math.sin(a1);
  const largeArc = end - start > 0.5 ? 1 : 0;

  // draw an SVG path
  return `<path d="M ${r + r0 * x0} ${r + r0 * y0} L ${r + r * x0} ${
    r + r * y0
  } A ${r} ${r} 0 ${largeArc} 1 ${r + r * x1} ${r + r * y1} L ${r + r0 * x1} ${
    r + r0 * y1
  } A ${r0} ${r0} 0 ${largeArc} 0 ${r + r0 * x0} ${r + r0 * y0}" fill="${color}" />`;
}

map.on('style.load', function () {
  addSource();
  addLayer();
  updateMarkers();
  createDonutChart(props);
});

function switchStyle(style) {
  var styleId = style.target.id;
  map.setStyle('mapbox://styles/wawasita/' + styleId);
}

for (var i = 0; i < inputs.length; i++) {
  inputs[i].onclick = switchStyle;
}

//Fuctional Map
// Create layer control, After the last frame rendered before the map enters an "idle" state.
// To create the layer control
map.on('idle', () => {
  // If these two layers were not added to the map, abort
  if (
    !map.getLayer('Suitable area to grow bamboo') ||
    !map.getLayer('Suitable area for primary factory') ||
    !map.getLayer('Suitable area for transportation to urban fabric')||
    !map.getLayer('Case Description')||
    !map.getLayer('Case Illustration')

  ) {
    return;
  }

  // Enumerate ids of the layers.
  const toggleableLayerIds = [
    'Suitable area to grow bamboo',
    'Suitable area for primary factory',
    'Suitable area for transportation to urban fabric',
    'Case Illustration',
    'Case Description'
  ];

  // Set up the corresponding toggle button for each layer.
  for (const id of toggleableLayerIds) {
    // Skip layers that already have a button set up.
    if (document.getElementById(id)) {
      continue;
    }

    // Create a link.
    const link = document.createElement('a');
    link.id = id;
    link.href = '#';
    link.textContent = id;
    link.className = 'active';

    // Show or hide layer when the toggle is clicked.
    link.onclick = function (e) {
      const clickedLayer = this.textContent;
      e.preventDefault();
      e.stopPropagation();

      const visibility = map.getLayoutProperty(clickedLayer, 'visibility');

      // Toggle layer visibility by changing the layout object's visibility property.
      if (visibility === 'visible') {
        map.setLayoutProperty(clickedLayer, 'visibility', 'none');
        this.className = '';
      } else {
        this.className = 'active';
        map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
      }
    };

    const layers = document.getElementById('menu');
    layers.appendChild(link);
  }
});


// lat-long Info
map.on('mousemove', (e) => {
  document.getElementById('info').innerHTML =
    // `e.point` is the x, y coordinates of the `mousemove` event
    // relative to the top-left corner of the map.
    JSON.stringify(e.point) +
    '<br />' +
    // `e.lngLat` is the longitude, latitude geographical position of the event.
    JSON.stringify(e.lngLat.wrap());
});

// Create the pop-up
//the showed text has to be in HTML
map.on('click', 'Suitable area to grow bamboo', (e) => {
  new mapboxgl.Popup()
    .setLngLat(e.lngLat)
    .setHTML(
      `
        <div><strong>Location</strong></div>
        <div style="margin-bottom: 12px;">${e.features[0].properties.CityName}, ${e.features[0].properties.Region}</div>
        <p><strong>Bamboo agricultural potential score on natural factor score: </strong></p>
        <div id="chart"></div>
        <div>
            <strong>Score for growing bamboo factor:</strong>
            <div>${e.features[0].properties.ScoreMean} / 3</div>
        </div>
        <div>
            <strong>Score for primary factory factor :</strong>
            <div>${e.features[0].properties.PriFactory} / 942</div>
        </div>
      `
    )
    .addTo(map);


  var chart = c3.generate({
    bindto: '#chart',
    data: {
      x: 'x',
      columns: [
        ['x', 'Elevation', 'Slope', 'Rain', 'Soil pH', 'Soil Texture'],
        [
          'Factor',
          e.features[0].properties.Elevation,
          e.features[0].properties.Slope,
          e.features[0].properties.Precip,
          e.features[0].properties.SoilpH,
          e.features[0].properties.SoilText,
        ],
        [
          'Mean',
          e.features[0].properties.ScoreMean,
          e.features[0].properties.ScoreMean,
          e.features[0].properties.ScoreMean,
          e.features[0].properties.ScoreMean,
          e.features[0].properties.ScoreMean,
        ],
      ],
      type: 'bar',
      colors: {
        Factor: '#aacfae',
        Mean: '#0d237d',
      },
      types: {
        Mean: 'line',
      },
    },
    axis: {
      x: {
        type: 'category',
        tick: {
          rotate: 90,
          multiline: false,
        },
        height: 65,
      },
    },
    size: {
      height: 200,
      width: 220,
    },
  });
});

map.on('click', 'Train Station', (e) => {
  new mapboxgl.Popup()
    .setLngLat(e.lngLat)
    .setHTML(
      '<strong>Station: </strong>' +
        e.features[0].properties.name +
        '<br><strong>Distance from Bangkok: </strong>' +
        e.features[0].properties.exact_km +
        ' km'
    )
    .addTo(map);
});

// Change the cursor to a pointer when
// the mouse is over the states layer.
map.on('mouseenter', 'Suitable area to grow bamboo', () => {
  map.getCanvas().style.cursor = 'pointer';
});
map.on('mouseenter', 'Train Station', () => {
  map.getCanvas().style.cursor = 'pointer';
});
// Change the cursor back to a pointer
// when it leaves the states layer.
map.on('mouseleave', 'Suitable area to grow bamboo', () => {
  map.getCanvas().style.cursor = '';
});
map.on('mouseleave', 'Train Station', () => {
  map.getCanvas().style.cursor = '';
});

// Create toggle sidebar
function toggleSidebar(id) {
  const elem = document.getElementById(id);
  // Add or remove the 'collapsed' CSS class from the sidebar element.
  // Returns boolean "true" or "false" whether 'collapsed' is in the class list.
  const collapsed = elem.classList.toggle('collapsed');
  const padding = {};
  // 'id' is 'right' or 'left'. When run at start, this object looks like: '{left: 300}';
  padding[id] = collapsed ? 0 : 350; // 0 if collapsed, 300 px if not. This matches the width of the sidebars in the .sidebar CSS class.
  // Use `map.easeTo()` with a padding option to adjust the map's center accounting for the position of sidebars.
  map.easeTo({
    padding: padding,
    duration: 1000, // In ms. This matches the CSS transition duration property.
  });
}
map.on('load', () => {
  toggleSidebar('left');
});

// Modal Images in the container
var oldPages = [],
  shownPage;

function toggleShow(shown, hidden) {
  if (shown && hidden) {
    oldPages.push(hidden);
    shownPage = shown;
  } else {
    hidden = shownPage;
    shownPage = shown = oldPages[oldPages.length - 1];
    oldPages.pop();
  }
  if (!shown) {
    return;
  }
  document.getElementById(shown).style.display = 'block';
  document.getElementById(hidden).style.display = 'none';
  return false;
}

// Get the modal
var modal = document.getElementById('myModal');

// Get the image and insert it inside the modal - use its "alt" text as a caption
var img = document.getElementById('myImg');
var modalImg = document.getElementById('img01');
var captionText = document.getElementById('caption');
img.onclick = function () {
  modal.style.display = 'block';
  //modalImg.src = this.src;
  //if showing the same image, don't cancel this
  captionText.innerHTML = this.alt;
};

// Get the <span> element that closes the modal
var span = document.getElementsByClassName('close')[0];

// When the user clicks on <span> (x), close the modal
span.onclick = function () {
  modal.style.display = 'none';
};
