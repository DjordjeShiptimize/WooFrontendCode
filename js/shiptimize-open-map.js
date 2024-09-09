import Utils from './shiptimize-utils.js';
import L from './leaflet-1.9.4';

export default class ShiptimizeOpenMap {

    constructor(options, shiptimize) {

        console.log("OPENMAPCONSTRUCT2222");

        this.shiptimize = shiptimize;
        this.options = options;
        this.map = null;
        this.host = options.host || 'https://my.shiptimize.me';
        this.icon_folder = typeof (shiptimize_icon_folder) !== 'undefined' ? shiptimize_icon_folder : '';
        this.mapWrapper = null;
        this.stylePath = options.stylePath || this.host + '/shopsystems/v2/assets/shiptimizewidget.css';
        this.markers = [];
        this.pickupPoints = [];
        this.carrier_icon_config = {
            30 : {
                extension:'svg',
                selectedState: true,
                iconSize: [32,32]
            },
            68 : {
                extension:'svg',
                selectedState: true,
                iconSize: [57,92]
            }
        };
        this.selectedPointIdx = null;
        this.moveListeners = [];
        this.isMoving = false; /* The map is loading points */
        this.isUserMoving = false; /* The user is moving the map */
        this.bounds = null;

    }

    setCarrierId(carrier_id) {
        console.log("OPENMAPCARRIERID")
        this.carrier_id = carrier_id;
        this.current_icon = this.getCarrierIconOfType(this.carrier_id)
    };

    selectPoint(idx) {
        console.log("Select point")
        console.log(idx);
        if (this.selectedPointIdx != null) {
            this.markers[this.selectedPointIdx].setIcon(this.getCarrierIconOfType(this.carrier_id, this.pickupPoints[this.selectedPointIdx].Type,0));
        }

        this.selectedPointIdx = idx;
        this.markers[idx].setIcon(this.getCarrierIconOfType(this.carrier_id, this.pickupPoints[idx].Type,1));
    };

    /**
     *
     * @param string imageUrl - full url to the icon
     * @return L.icon object
     */
    createIcon(imageUrl) {

        let iconSize = typeof(this.carrier_icon_config[this.carrier_id]) != "undefined" ? this.carrier_icon_config[this.carrier_id].iconSize : 50;
        return L.icon({
            iconUrl: imageUrl,
            iconSize: [iconSize, iconSize], /* size of the icon */
            iconAnchor: [iconSize / 2, iconSize], /* point of the icon which will correspond to marker's location */
            popupAnchor: [-1 * iconSize / 2, -1 * iconSize / 2] /* point from which the popup should open relative to the iconAnchor */
        });

    }

    setZoom = function (zoom) {
        this.map.setZoom(zoom);
    }

    isMapMoving() {
        return this.isMoving || this.isUserMoving;
    };


    /**
     * @param decimal lat
     * @param decimal lng
     */
    centerMap(lat, lng) {

        let latlng = L.latLng(lat, lng);

    }

    /**
     * if the script has not been loaded , load it.
     * We use this function because we only want to load the script when the user clicks the button
     */
    // ##DJDJ Proveri radi li bez ovoga
    grantReady() {

        if (!this.isScriptLoaded) {

            this.loadScript();

        }

    }


    // ##DJDJ Bpost stuff
    // geocode (queryparts, fcallback) {
    //     console.log("BPOSTGEOCODE");
    //     this._geocode(queryparts.address, fcallback);
    // };
    //
    // _geocode (queryparts, fcallback) {
    //
    //     jQuery.getJSON('https://bpostdev.shiptimize.me/shopsystems/v2/shopify/bpostgeocode?searchText=' + queryparts, {}, function(resp) {
    //         console.log(resp.response);
    //         let results = [];
    //         let index = 0;
    //
    //         if (resp.response && resp.response.topSuggestions) {
    //             console.log(1);
    //             console.log(resp);
    //             let places = resp.response.topSuggestions;
    //             for (let i = 0; i < places.length; ++i) {
    //                 index++;
    //                 // ##DJDJ Vrati ovo kako je bilo mozda?
    //                 if (places[i].address.searchBarString) {
    //                 // if (index == 1) {
    //                     console.log(2);
    //                     results.push({
    //                         "display_name": places[i].address.searchBarString,
    //                         "address": {
    //                             City: places[i].address.municipalityName,
    //                             Country: 'be',
    //                             PostalCode: places[i].address.postalCode,
    //                             // ##DJDJ Ovo isto
    //                             Streetname1: places[i].address.searchBarString,
    //                             // Streetname1: "Test street name",
    //                         },
    //                         "lat": places[i].address.latitude,
    //                         "lng": places[i].address.longitude
    //                     });
    //                 }
    //             }
    //         }
    //
    //         console.log("Rezultati");
    //         console.log(results);
    //
    //         fcallback && fcallback(results);
    //     });
    // };


    // ##DJDJ Shiptimize part
    geocode (queryparts, fcallback) {
        console.log("GEOCODE FUNCTION");
        console.log(queryparts);
        let queryval = queryparts.address;
        let query = "";

        if(queryval.match(/^([0-9\-]+)$/)) {
            if (queryparts.country == 'Portugal' && typeof(missingZipPT) != 'undefined') {
                /* Is this a postal code we know is not geocodable in nominatim? */
                let zip4dig = queryval.substring(0,4);
                for (let i=0; i<missingZipPT.length; ++i) {
                    if(missingZipPT[i].zipcode == zip4dig) {
                        this.queryResults = {
                            "display_name": missingZipPT[i].display_name,
                            "lat": missingZipPT[i].lat,
                            "lon": missingZipPT[i].lng
                        };
                        return fcallback([this.queryResults]);
                    }
                }
            }
            query = 'postalcode=' + queryval + '&country=' + this.shiptimize.address.Country;
        }
        else if (this.shiptimize.address.Country) {
            query = 'q=' + queryval;
        }
        console.log(query);

        jQuery("#sw-query-results").html('<div class="sw-loader"><div></div><div></div><div></div></div>');
        jQuery.getJSON("https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&" + query, (res) => {
            console.log("Rezultat");
            console.log(res);
            if (res.length == 0 &&  queryval.match(/^([0-9\-]+)$/) && this.shiptimize.address.Country.toUpperCase() == 'PT') {
                jQuery("#sw-query").val(queryval.substring(0,4));
               // ##DJDJ This is missing
                this.geocodeQuery();
                return;
            }

            this.queryResults = [];
            console.log("TESTTESTOVDE");
            for (let i=0; i < res.length; ++i) {
                console.log(res[i]);
                if (res[i].address.country.toLowerCase() == this.shiptimize.address.Country.toLowerCase() && res[i].address.postcode) {
                    let nomAddr =  res[i];
                    let street = typeof(nomAddr.address.road) != 'undefined' ? nomAddr.address.road : nomAddr.display_name;

                    console.log(nomAddr);
                    this.queryResults.push({
                        "display_name": street + ' ' + nomAddr.address.postcode + ' ' + (nomAddr.address.city || nomAddr.address.region || nomAddr.address.county) + nomAddr.address.country_code,
                        "lat": nomAddr.lat,
                        "lng":nomAddr.lon
                    });
                }
            }

            console.log(fcallback);
            console.log(this.queryResults);

            fcallback && fcallback(this.queryResults);
        });
    };

    /**
     * @param f_callback what function to call when the request resolves
     * @param city - city name
     * @param country - country in iso2 uppercase
     * @param postalcode - the postal code
     * @param streetname - the streetname
     */
    geocodeAddress(f_callback, city, country, postalcode, streetname) {

        var queryString = "https://nominatim.openstreetmap.org/search?format=json&addressdetails=1" +
            "&city=" + city +
            "&country=" + country;

        if (typeof (postalcode) !== 'undefined') {

            if (country == 'PT' || country == 'Portugal') {

                postalcode = postalcode.substr(0, 4);

            }
            queryString += "&postalcode=" + postalcode;

        }

        if (typeof (streetname) !== 'undefined') {

            queryString += "&street=" + streetname;

        }

        if (typeof(btoa) !== 'undefined' && typeof(this.address_cache[btoa(queryString)]) !== 'undefined') {

            f_callback(this.address_cache[btoa(queryString)]);

        }
        else {

            jQuery.getJSON(queryString, {}, (response) =>  {

                let geocode = {
                    'iso2': '',
                    'lat': '',
                    'lng': ''
                };

                if (response.length > 0) {

                    let location = response[0];

                    geocode.iso2 = location.address.country_code;

                    geocode.lat = location.lat;
                    geocode.lng = location.lon;

                }

                this.address_cache[btoa(queryString)] = geocode;
                f_callback(geocode);

                console.log(response);

            });

        }

    };

    // ##DJDJ Bpost
    // geocodeAddressParts (fcallback, city, country, postalcode, streetname) {
    //     let queryString = '';
    //     console.log("Address parts");
    //
    //     if (typeof(streetname) != 'undefined') {
    //         queryString += encodeURI(streetname);
    //     }
    //
    //     if (typeof(postalcode) != 'undefined') {
    //         queryString += "," + postalcode;
    //     }
    //
    //     this._geocode(queryString, function(results) {
    //         let latln = { lat:0, lng:0};
    //         if (results.length > 0) {
    //             latln = {lat: results[0].latitude, lng: results[0].longitude };
    //         }
    //         fcallback && fcallback(latln);
    //     });
    //
    // };

    // ##DJDJ Shiptimize code
    geocodeAddressParts (f_callback, city, country, postalcode, streetname) {
        console.log("ADDRESSPARTS MICO");
        console.log(city);
        var queryString = "https://nominatim.openstreetmap.org/search?format=json&addressdetails=1" +
            "&city=" + city +
            "&country_code=" + country;

        if (typeof (postalcode) != 'undefined') {
            if (country == 'PT' || country == 'Portugal') {
                postalcode = postalcode.substr(0, 4);
            }
            queryString += "&postalcode=" + postalcode;
        }

        if (typeof (streetname) != 'undefined') {
            queryString += "&street=" + encodeURI(streetname);
        }

        jQuery.getJSON(queryString, {}, function (response) {
            let geocode = {
                'iso2': '',
                'lat': '',
                'lng': ''
            };

            if (response.length > 0) {
                let location = response[0];

                geocode.iso2 = location.address.country_code;

                geocode.lat = location.lat;
                geocode.lng = location.lon;
            }

            console.log("geocode  " +  response.length  + 'results');
            if(geocode.lan) {
                console.log("returning " , geocode);
            }
            f_callback(geocode);

        });
    };

    loadScript() {

        Utils.injectExternalScript(SHIPTIMIZE_PLUGIN_URL + "views/js/leaflet-1.9.4.js");
        this.isScriptLoaded = true;
        return;

    }

    /**
     * Leaflet does not receive a callback so we wait here for the script to be loaded
     */
    initMap(){
        console.log("Load map");
        // this.mapWrapper = jQuery(this.options.mapParentContainer);
        this.mapWrapper = jQuery("body");

        if (this.mapWrapper.hasClass('leaflet-container')) {
            console.log("map was already loaded");
            return;
        }


        this.icon_selected = this.createIcon(this.icon_folder + 'selected.png');
        this.icon_default = this.createIcon(this.icon_folder + 'default.png');

        if (!this.current_icon) {
            this.current_icon = this.icon_default;
        }

        this.map = new L.map('sw-map', {
            "zoom": 16,
            "center": [51.505, -0.09],
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            "attribution": '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        })
        .addTo(this.map);

        this.options.onmapready && this.options.onmapready();

        this.map.on('click', () => {
            jQuery(".sw-map-selected-point").html("");
        });

        this.map.on('moveend', () => {
            let center = this.getCenter();
            if(!this.isInBounds(center.lat, center.lng)) {
                this.moveEnd();
            }
        });
    }

    async moveEnd() {
        if ( this.isMapMoving() ) {
            return;
        }

        this.isUserMoving = true;
        let mapCenter = this.map.getCenter();

        for(let i=0; this.moveListeners && i < this.moveListeners.length; ++i) {
            await this.moveListeners[i](mapCenter);
        }

        console.log("MOVE LISTENERS ENDED");
        this.isUserMoving = false;
    };

    addMapMoveListener(fcallback) {
        this.moveListeners.push(fcallback);
    }

    getCenter() {
        return this.map.getCenter();
    };

    isInBounds (lat, lng) {
        if (!this.bounds) {
            return false;
        }

        let inLat = lat > this.bounds.bottomLeft.lat && lat < this.bounds.topRight.lat;
        let eastBound = lng < this.bounds.topRight.lng;
        let westBound = lng > this.bounds.bottomLeft.lng;
        let inLng;

        if (this.bounds.topRight.lng < this.bounds.bottomLeft.lng) {
            inLng = eastBound || westBound;
        }
        else {
            inLng = eastBound && westBound;
        }

        return inLng && inLat;
    };
    clearMarkers() {
        console.log("Clear markers");
        console.log(this.map);

        this.bounds = null;
        this.selectedPointIdx = null;

        if (this.markers.length > 0) {
            for (let i = 0; i < this.markers.length; ++i) {
                this.map.removeLayer(this.markers[i]);
            }
        }
        this.markers = [];

        if (!this.isMoving) {
            this.map.setMinZoom(0);
        }

    }


    /**
     * Add the markers to map
     * @param array pickupPoints - an array of pickupPoints
     * @param function callback
     */
    addMarkers(pickupPoints, callback) {
        console.log("ADD MARKERS 232323");
        this.isMoving = true;
        this.pickupPoints = pickupPoints;

        for (let x = 0; x < pickupPoints.length; ++x) {
            this.markers[x] = this.getMarker(pickupPoints[x]);
            /*    we need to do this because the values for lat,lng we have are rounded, so they will not match the ones returned by google */
            this.pickupPoints[x].marker = this.markers[x];

            this.markers[x].on('click', function () {
                if (typeof (callback) == 'function') {
                    callback(x);
                }
            });
        }

        this.fitBounds();

        console.log("Gotov fit bounds");
    }

    resetMarker(marker) {

        marker.setIcon(this.icon_default);

    }

    selectMarker(marker) {

        marker.setIcon(this.icon_selected);

    }

    /**
     * Adjust the zoom in the map to display all the markers
     * There's a fit bounds that receives 2 corners, but calculating them is up to us.
     * corners: top left, bottom right
     * then we center the map at the center of the square
     */
    fitBounds = function () {
        console.log("Test success 25");

        jQuery('html,body')
            .scrollTop(0);
        this.map.invalidateSize();

        /*this function changes the map center*/
        this.isMoving = true;
        let bottomLeft = [parseFloat(this.pickupPoints[0].Lat), parseFloat(this.pickupPoints[0].Long)];
        let topRight = [parseFloat(this.pickupPoints[0].Lat), parseFloat(this.pickupPoints[0].Long)];
        console.log("Test success 21");

        for (let i = 0; i < this.pickupPoints.length; ++i) {
            let lat = parseFloat(this.pickupPoints[i].Lat);
            let lng = parseFloat(this.pickupPoints[i].Long);

            if (lat < bottomLeft[0]) {
                bottomLeft[0] = lat;
            }

            if (lat > topRight[0]) {
                topRight[0] = lat;
            }

            if (lng > topRight[1]) {
                topRight[1] = lng;
            }

            if (lng < bottomLeft[1]) {
                bottomLeft[1] = lng;
            }
        }


        let centerX = bottomLeft[0] + (topRight[0] - bottomLeft[0]) / 2;
        let centerY = bottomLeft[1] + (topRight[1] - bottomLeft[1]) / 2;
        this.center = [centerX, centerY];

        this.centerMap(centerX,centerY);
        console.log("Test success 23");

        this.map.fitBounds([
            bottomLeft,
            topRight
        ]);

        this.bounds = {
            "bottomLeft": { lat: bottomLeft[0], lng: bottomLeft[1] },
            "topRight": { lat: topRight[0], lng: topRight[1] }
        };

        /* Grant changes are applied before we state we're no longer moving the map around via js */
        setTimeout( () => {
            this.isMoving = false;

            console.log("Test success 2");

            let zoom = 10;
            if(zoom  > 16 || zoom < 10) {
                zoom =  10;
            }
            this.map.setMinZoom(zoom);

            console.log("map zoom is " , zoom);

        },1000);

        return false;
    };


    getIcon(pickupPoint) {
        console.log("GETICON");
        console.log(this.carrier_id);
        console.log(pickupPoint);
        return pickupPoint.Type > 0 ? this.getCarrierIconOfType(this.carrier_id, pickupPoint.Type) : this.current_icon;

    }

    /**
     * Return a marker for the openLayers
     * IconAnchor: The coordinates of the "tip" of the icon (relative to its top left corner).
     * The icon will be aligned so that this point is at the marker's geographical location.
     * Centered by default if size is specified, also can be set in CSS with negative margins.
     */
    getMarker(pickupPoint) {
        console.log("GetMarker");

        let marker = L.marker([pickupPoint.Lat, pickupPoint.Long], {
            "icon": this.getIcon(pickupPoint),
            "title": pickupPoint.Information.Name + "\n" + pickupPoint.Information.Address
        });
        marker.addTo(this.map);
        return marker;
    }


    getCarrierIconOfType(carrier_id,type,selected){
        console.log("CARRIERIICONOFTYPE");
        console.log(carrier_id);
        console.log(type);
        console.log(selected);

        var allowedTypes = [1,2,4,16,990];
        let carrier_icon_url;

        let file_extension = '.' + ( typeof(this.carrier_icon_config[carrier_id]) != 'undefined' ? this.carrier_icon_config[carrier_id].extension : "png" );
        let selectedextension = typeof(this.carrier_icon_config[carrier_id]) != 'undefined'  && this.carrier_icon_config[carrier_id].selectedState  && selected? '_s' : '';
        if (selected && !selectedextension) {
            return this.icon_selected;
        }

        // ##DJDJ
        // ##This is for the _1 or the _2 and stuff added to the img, will need to define some way to do it without the carrier folder
        if (type  && allowedTypes.includes(type)) {
            carrier_icon_url = this.icon_folder + '' + carrier_id + '_' + type + selectedextension + file_extension;
        }
        else {
            carrier_icon_url = this.icon_folder + carrier_id +  selectedextension + file_extension;
        }

        console.log(carrier_icon_url);
        return this.createIcon(carrier_icon_url);
    };

    /**
     * Checks if we have an icon for this carrier.
     * If yes then change the carrier icon
     * If not then use the default icon
     *
     * @param int carrier_id - the carrier id
     */
    setCarrierIcon(carrier_id) {

        console.log("SetCarrierIcon")

        if (typeof (L) === 'undefined') {

            setTimeout(() => {

                this.setCarrierIcon(carrier_id);

            }, 200);
            return;

        }
        this.carrier_id = carrier_id;
        let carrier_icon_url = this.icon_folder + '' + carrier_id + '.png';
        if(typeof(this.cache_icon_valid[carrier_icon_url]) === 'undefined') {

            this.cache_icon_valid[carrier_icon_url] = Utils.carrierIconExists(carrier_id, '', this.icon_folder);

        }
        this.current_icon = this.cache_icon_valid[carrier_icon_url] ? this.createIcon(carrier_icon_url) : this.icon_default;

    }



}