// eslint-disable-next-line prop-types

import ShiptimizeOpenMap2 from "./shiptimize-open-map";
import ShiptimizeGmaps from "./shiptimize-gmaps";
import Woocommerce from './shiptimize-woo-commerce.js'

class ShiptimizeWidget {
    constructor(options) {
        this.pickupPoints = [];
        this.selectedPoint = null;
        this.options = options;

        this.markers = [];
        this.host = options.host || 'https://shiptimize.me';
        this.debug = options.debug || 0;

        this.mapParentContainer = options.mapParentContainer || 'body';
        this.buttonParentContainer = options.buttonParentContainer || '';
        this.isScriptLoaded = false;
        this.buttonClass = this.options.button_class || '';
        this.labels = this.options.labels || {};

        this.platform = new Woocommerce(options.ajax_url);
        this.timeoutKeyDown = null;
        this.searchRunning = false;
        this.address = this.options.address || null;
        this.carrier_id = this.options.carrierId || 0;
        this.lang = 'en';
        this.weekdaynames = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
        this.selectedDisplayOption = 0;
        this.cacheResults = {};

        console.log("Jeste checkout ili nije");


        jQuery(document).ready(() => {
            var checkVisibility = setInterval(() => {
                var inputElement = jQuery(".wc-block-components-shipping-rates-control__package");
                if (inputElement.is(':visible')) {
                    clearInterval(checkVisibility);

                    console.log("Ovdeeee sam");
                    window.selectedText = "";
                    window.selectedText = jQuery("fieldset.wc-block-checkout__shipping-option")
                        .find(".wc-block-components-radio-control__input:checked")
                        .closest("label")
                        .find(".wc-block-components-radio-control__label")
                        .text();

                    if (window.selectedText == ""){
                        console.log("Prazan")
                        jQuery("fieldset.wc-block-checkout__shipping-option")
                            .find(".wc-block-components-radio-control__option-layout")
                            .each(function () {
                                window.selectedText = jQuery(this).find(".wc-block-components-radio-control__label").text();
                            });
                    }


                    if (this.isBlockCheckout()){

                        this.getSelectedCarrier();
                        this.getFormChange();
                    }

                    this.getOnClick();
                    this.getOnSubmitButtonBlockClick();
                }

            })


        });
        // if (!this.isBlockCheckout()){
        //     this.getNotBlockFormChange();
        // }


    }

    getFormChange(){
        jQuery(".wc-block-checkout__form").on('change', () => {
            // This function will be triggered when any form field inside the "checkout" form is changed
            console.log("Form changed! block block");

            setTimeout(() => {

                window.selectedText = jQuery("fieldset.wc-block-checkout__shipping-option")
                    .find(".wc-block-components-radio-control__input:checked")
                    .closest("label")
                    .find(".wc-block-components-radio-control__label")
                    .text();

                if (window.selectedText === undefined){
                    console.log("Prazan")
                    jQuery("fieldset.wc-block-checkout__shipping-option")
                        .find(".wc-block-components-radio-control__option-layout")
                        .each(function () {
                            window.selectedText = jQuery(this).find(".wc-block-components-radio-control__label").text();
                        });
                }

                // You can perform your desired actions here
                this.getSelectedCarrier();
            }, 2000);
        });

    }

    getOnSubmitButtonBlockClick() {

        jQuery('.wc-block-components-checkout-place-order-button').on('click', function (e) {
            let shipping_pickup_id = jQuery("#shipping_pickup_id").val();
            console.log("Clicked");
            console.log(carrier_id);
            console.log(window.mandatoryData);
            if (window.mandatoryData != "" && window.mandatoryData.pickupMandatory && shipping_pickup_id == ""){

                var modal = jQuery('<div>', { id: 'myModal', css: {
                        'display': 'none',
                        'position': 'fixed',
                        'z-index': '1',
                        'left': '0',
                        'top': '0',
                        'width': '100%',
                        'height': '100%',
                        'overflow': 'auto',
                        'background-color': 'rgba(0,0,0,0.4)'
                    }});

                var modalContent = jQuery('<div>', { css: {
                        'background-color': '#fefefe',
                        'margin': '15% auto',
                        'padding': '20px',
                        'border': '1px solid #888',
                        'width': '80%'
                    }});

                var closeButton = jQuery('<span>', { text: '×', css: {
                        'color': '#aaa',
                        'float': 'right',
                        'font-size': '28px',
                        'font-weight': 'bold',
                        'cursor': 'pointer'
                    }});

                var message = jQuery('<p>', { text: 'Point selection is mandatory. Select a point or a different Shipping method' });


                let button = jQuery("<button class='button alt shiptimize-pick-location' type='button' onClick='shiptimize.getPickupLocations(event)'>" + shiptimize_choose_pickup_location + "</button>");



                // Append the elements
                modalContent.append(closeButton);
                modalContent.append(message);
                modal.append(modalContent);
                modalContent.append(button);

                jQuery('body').append(modal);

                // Show the modal
                modal.show();

                // Close the modal when the user clicks on <span> (x)
                closeButton.on('click', function() {
                    modal.hide();
                });

                // Close the modal when the user clicks anywhere outside of the modal content
                jQuery(window).on('click', function(event) {
                    if (jQuery(event.target).is(modal)) {
                        modal.hide();
                    }
                });


                return false;
            }
        })
    }

    getSelectedCarrier(){

        console.log("selectedCarrier")
        console.log(window.selectedText);
        window.mandatoryData = "";
        jQuery("#shiptimize_pickup_button").remove();

        let req = {
            'action': 'shiptimize_selected_carrier',
            'carrier': window.selectedText
        };

        jQuery.getJSON(this.options.ajax_url, req ,  (data)  => {
            console.log("Caoaooo nasaooo22");
            console.log(data.status);
            if (data.status == 1 ){
                console.log("Caooooo status 123");
                if (data.pickupMandatory == true){
                    window.mandatoryData = data;
                }
                this.carrier_id = data.carrier_id;
                window.carrier_id = data.carrier_id;
                jQuery(document).ready(() => {
                    var checkVisibility = setInterval(() => {
                        var inputElement = jQuery(".wc-block-components-shipping-rates-control__package");

                        if (inputElement.is(':visible')) {
                            // The input element is visible, you can proceed with your script
                            clearInterval(checkVisibility); // Stop checking
                            // Your code here
                            console.log("ITS VISIBLE 222");
                            this.getBlockShippingData();
                            console.log(inputElement);
                            let button = jQuery("<button class='button alt shiptimize-pick-location' type='button' id='shiptimize_pickup_button' onClick='shiptimize.getPickupLocations(event)'>"+ shiptimize_choose_pickup_location +"</button>");
                            let shipping_pickup_id = jQuery("<input type='hidden' name='shipping_pickup_id' id='shipping_pickup_id'/>");
                            let shipping_pickup_label = jQuery("<input type='hidden' name='shipping_pickup_label' id='shipping_pickup_label'/>");
                            let shiptimize_pickup_extended = jQuery("<input type='hidden' name='shiptimize_pickup_extended' id='shipping_pickup_extended'/>");
                            let shiptimize_pickup_description = jQuery("<span className='shiptimize-pickup__description' id='shiptimize-pickup__description'></span>");
                            let shipping_carrier_id = jQuery("<tr style='display: none'><td><input type='hidden' name='shipping_carrier_id' id='shipping_carrier_id'/>");

                            console.log(button);
                            inputElement[0].append(button[0]);
                            inputElement[0].append(shipping_pickup_id[0]);
                            inputElement[0].append(shipping_pickup_label[0]);
                            inputElement[0].append(shiptimize_pickup_extended[0]);
                            inputElement[0].append(shiptimize_pickup_description[0]);
                            inputElement[0].append(shipping_carrier_id[0]);

                            this.mapinterface.setCarrierId(this.carrier_id);

                        }
                    }, 100); // Check every 100 milliseconds
                });


            }
            // console.log(shiptimize_shipping_methods);

        }).fail((err) => {
            console.log("Fatal error widget requesting points do we have an API bug?");
        });

    }

    isBlockCheckout(){
        if (jQuery(".wc-block-checkout").length > 0){
            return true;
        }
        return false;
    }

    getOnClick(){
        jQuery("#sw-query-btn").on('click' , () => {
            this.geocodeQuery();
        })



        jQuery('form[name="checkout"]').on('change', () => {
            // This function will be triggered when any form field inside the "checkout" form is changed
            console.log("Form changed!");
            this.getFormShippingData();
            // You can perform your desired actions here
        });

    }

    getFormShippingData() {

        var country = jQuery('#billing_country').val(),
            state = jQuery('#billing_state').val(),
            postcode = jQuery('input#billing_postcode').val(),
            city = jQuery('#billing_city').val(),
            address = jQuery('input#billing_address_1').val(),
            address_2 = jQuery('input#billing_address_2').val(),
            s_country = country,
            s_state = state,
            s_postcode = postcode,
            s_city = city,
            s_address = address,
            s_address_2 = address_2;


        if (jQuery('#ship-to-different-address').find('input').is(':checked')) {
            s_country = jQuery('#shipping_country').val();
            s_state = jQuery('#shipping_state').val();
            s_postcode = jQuery('input#shipping_postcode').val();
            s_city = jQuery('#shipping_city').val();
            s_address = jQuery('input#shipping_address_1').val();
            s_address_2 = jQuery('input#shipping_address_2').val();
        }


        window.shiptimize_shipping_address = {
            "Address":{
                "Lat": "",
                "Long": "",
                "Streetname1": s_address,
                "Streetname2": s_address_2,
                "HouseNumber": '',
                "NumberExtension": '',
                "PostalCode": s_postcode,
                "s_postcode": s_postcode,
                "City": s_city,
                "Country": s_country,
                "State": s_state,

            },
            post_data: jQuery('form.checkout').serialize(),
            "CarrierId": jQuery("#shipping_carrier_id").val()
        };
        this.address = window.shiptimize_shipping_address.Address;
    }

    getShiptimizeId(mage_id) {
        var carrier_id = mage_id.match(/([\d]+)_pickup/);
        if (carrier_id != null) {
            return carrier_id[1];
        }

        for (let x = 0; x < shiptimize_carriers.length; ++x) {
            if (shiptimize_carriers[x].ClassName === mage_id) {
                return typeof (shiptimize_carriers[x].Id) == 'object' ? shiptimize_carriers[x].Id['0'] : shiptimize_carriers[x].Id;
            }
        }

        return 0;
    }

    /*
    * Adds the map to the page
    */
    init() {
        this.address && this.setAddress(this.address);
        this.loadScripts();

        !this.address && localStorage.getItem('ShiptimizeAddress') && this.setAddress(JSON.parse(localStorage.getItem('ShiptimizeAddress')));
    };


    addPointInfo(p, selected, extra_class, parentContainer) {
        if (typeof(extra_class) == 'undefined') {
            extra_class = '';
        }

        let open = typeof(p.WorkingHoursRaw) != 'undefined' && p.WorkingHoursRaw ? JSON.parse(p.WorkingHoursRaw) : [];
        let openhtml = '';
        let m2f = '';
        let wkd = '';
        let local = p.Information.Address;

        /* ----------------------
        / To replace when we have an actual format for it  */
        let openHours = [];

        /* LEGACY code that we are using to transform the raw data into something we can work with  ----------- */
        let regexFormatDev = new RegExp(/([a-zA-Z0-9]+)\_([a-zA-Z0-9]+)\_([a-zA-Z0-9]+)\_([a-zA-Z0-9]+)\_([a-zA-Z0-9]+)\_([a-zA-Z0-9]+)\_([a-zA-Z0-9]+)/, 'g');
        let regexFormatLive = new RegExp(/([a-zA-Z0-9]+)\_([a-zA-Z0-9]+)\_([a-zA-Z0-9]+)\_([a-zA-Z0-9]+)/, 'g');
        let regexFormat = regexFormatLive;
        let regDay = 1; /* Monday, Tuesday ..*/
        let regOpenIdx = 4; /* 1,2,... */
        let regTypeIdx = 2; /* Open | closing */


        if (Object.keys(open).length > 0 && Object.keys(open).shift().match(regexFormatDev)) {
            regexFormat = regexFormatDev;
            regTypeIdx = 3;
            regOpenIdx = 7;
        }

        for (key in open) {
            let value = open[key];

            if (key.match(regexFormat)) {
                let res = regexFormat.exec(key);
                let dayname = res[regDay];
                let openidx = parseInt(res[regOpenIdx]) - 1;
                let dayidx = this.weekdaynames.indexOf(dayname);

                if (typeof(openHours[dayidx]) == 'undefined') {
                    openHours[dayidx] = [];
                }

                if (typeof(openHours[dayidx][openidx]) == 'undefined') {
                    openHours[dayidx][openidx] = {
                        OpenTime: '',
                        CloseTime: ''
                    };
                }

                openHours[dayidx][openidx][res[regTypeIdx] == 'Closing' ? 'CloseTime' : 'OpenTime'] = value;
            }
        }

        /* Make sure it's sorted */
        for (let i = 0; i < openHours.length; ++i) {
            /* Sometimes it's closed on monday meaning there's nothing at idx 0*/
            if (typeof(openHours[i]) != "undefined") {
                let schedule = openHours[i];
                schedule.sort((a, b) => {
                    let aopen = parseInt(a.OpenTime.substring(0, 2));
                    let bopen = parseInt(b.OpenTime.substring(0, 2));
                    return aopen - bopen;
                });
            }
        }

        /* Group data set
        Label can be:
        First day - last day with same schedule
        Every day */

        open = (typeof(p.WorkingHours) != 'undefined') ? p.WorkingHours : openHours;
        /** It's a hash, not an array **/
        let ndaysopen = Object.keys(open).length;
        let fromday = this.weekdaynames[0];
        let previousTime = '';
        let hourshtml = '';
        let fromdayidx = 0;
        let toDay = '';
        /*-------*/

        for (let i = 0; i < 7; ++i) {
            let day = open[i];
            let dayhtml = '';
            let today = this.weekdaynames[i];

            dayhtml += `<div class="sw-point-info-day">`;
            hourshtml = '';

            for (let j = 0; day && j < day.length; ++j) {
                let hours = day[j];
                if (hours.OpenTime == null && hours.CloseTime == '23:59') {
                    hourshtml += '24h';
                } else {
                    hourshtml += (hourshtml ? ' | ' : '') + `<span>${hours.OpenTime ? hours.OpenTime  : ''} - ${hours.CloseTime ? hours.CloseTime : ''}</span>`;
                }
            }

            /** last day or different time, print last **/
            if ( previousTime && (previousTime != hourshtml) || (i == 6)) {
                /** not a lot of sense in mon-mon*/
                let isinterval = i - fromdayidx > 2;
                let islast = i==6;

                if (previousTime) {
                    toDay = (islast && (hourshtml == previousTime)) ? this.weekdaynames[i] : this.weekdaynames[i-1];
                    dayhtml += `<label>${( isinterval && fromday ? fromday + ' - ' : '' ) + toDay}:</label><span>${previousTime}</span></div>`;
                    openhtml += dayhtml;
                }

                if (islast && hourshtml &&  (hourshtml != previousTime)) {
                    openhtml += `<div class="sw-point-info-day"><label>${this.weekdaynames[i]}:</label><span>${hourshtml}</span></div></div>`;
                }

                fromday = i < ndaysopen - 1 ? this.weekdaynames[i] : '';
                fromdayidx = i;
                previousTime = hourshtml;


            } else {
                previousTime = hourshtml;
            }
        }

        if (!openhtml && previousTime) {
            openhtml = `<label>${fromday} - ${this.weekdaynames[ndaysopen - 1]}: </label><span>${previousTime}</span></div>`;
        }

        /* / END LEGACY code ----------- */

        let ePointInfo = jQuery(`<div class="sw-point-info ${extra_class}">
  <h4 class='sw-point-info-name'>${p.Information.Name}</h4>
  <div class='sw-point-info-addr'>${local}</div>
  <div class='sw-point-info-open'>${openhtml}</div>
  </div>`);

        /* Is there aditional information required?  */
        if (typeof(p.MapFieldsSelect) != 'undefined') {
            let moreFields = p.MapFieldsSelect;
            for (let k = 0; k < moreFields.length; ++k) {
                ePointInfo.append(`<div class="sw-point-info-additional"><label>${moreFields[k]}</label><input data-id="${moreFields[k]}" class="shiptimize_mapfields${p.PointId}" type="text"  id="${moreFields[k]}${p.PointId}"/></div>`);
            }
        }

        let btn = jQuery(`<button class="sw-point-info-btn ${selected ? 'selected' : ''}">${selected ? 'Selected' : 'Select'}</button>`);
        btn.on('click', () => {
            this.selectPoint(p);
        });

        ePointInfo.append(btn);
        parentContainer.append(ePointInfo);
    };

    /**
     * Append custom style
     * @param string css - a string with the style to inject
     */
    addCustomStyle(css) {

        var style = document.createElement("style");
        style.type = "text/css";

        if (style.styleSheet) {
            style.styleSheet.cssText = css;
        } else {
            style.appendChild(document.createTextNode(css));
        }

        document.getElementsByTagName("head")[0].appendChild(style);
    };

    addMapHtml() {
        console.log("ADD MAP HTML Options address")

        let addresstr = '';
        /* Ireland does not have postal codes */
        if (this.options.address.Streetname1) {
            addresstr = this.options.address.PostalCode ? this.options.address.PostalCode : this.options.address.Streetname1;
        }
        let maphtml = `<div id="sw">
    <div id="sw__overlay"></div>
    <div id="sw__container">
      <div id="sw-search">
        <div id="sw-query-wrapper">
          <input type="text" id="sw-query" placeholder="${addresstr}">
        </div>
        <div id="sw-query-results"></div>
        <div id="query-options">
        </div>
      </div>
      <div id="sw-display-options">
      </div> 
      <div id="sw-map-wrapper" class="sw-tab selected">
        <div class="sw-query-results-description"></div>
        <div id="sw-map" class="shiptimize-pickup__map"></div>
        <div id="sw-map-error"></div> 
        <div id="sw-map-selected-point"></div>
      </div>  
      <div class='sw-tab'>
        <div class="sw-query-results-description"></div>
        <div id="sw-list-points"></div>
      </div>
      <div id="sw-map-message"></div>
      <div id="sw-search-status">
        <div class="sw-loader"><div></div><div></div><div></div></div>
      </div>
    </div>
  </div>`;
        jQuery(this.mapParentContainer).append(maphtml);
        let displayOptions = jQuery("#sw-display-options");
        let optMap = jQuery(`<span class='sw-display-option selected'>MAP</span>`);
        let optList = jQuery(`<span class='sw-display-option'">LIST</span>`);

        optMap.on('click', () => {
            this.selectDisplayOption(0);
        });
        optList.on('click', () => {
            this.selectDisplayOption(1);
        });

        displayOptions.append(optMap);
        displayOptions.append(optList);

        let queryopt = jQuery("#sw-query-wrapper");
        let searchbtn = jQuery(`<button id="sw-query-btn"">Search</button>`);
        queryopt.append(searchbtn);

        searchbtn.on('click', () => {
            this.geocodeQuery();
        });

        let queryinput = jQuery("#sw-query");
        queryinput.on('keyup', (evt) => {
            if (evt.keyCode == 13) {
                this.geocodeQuery();
            }

            this.timeoutKeyDown && clearTimeout(this.timeoutKeyDown);
            this.timeoutKeyDown = setTimeout(() => {
                this.geocodeQuery();
            }, 300);
        });

        jQuery("#sw__overlay").click(() => {
            this.closeMap();
        });
    };


    /**
     * @param decimal lat
     * @param decimal lng
     */
    centerMap(lat, lng) {
        this.mapinterface.centerMap(lat, lng);
    };

    /**
     * Hide the map
     */
    closeMap() {
        jQuery("#sw")
            .removeClass("open");
        jQuery('html,body')
            .scrollTop(this.userScroll);
    };

    displayMessage(msg) {
        jQuery('#sw-map-message').addClass("open");
        jQuery('#sw-map-message').html(msg);
    };

    /**
     * Display the possible option to the user in a list under the search input
     */
    // ##DJDJ Shiptimize
    displayPlaces(places) {

        console.log("Display places");
        console.log(places);
        jQuery(".sw-query-results-description").html('');

        this.queryResults = places;
        let resultsContainer = jQuery("#sw-query-results");

        let html = '';
        for (let i = 0; i < places.length; ++i) {
            html += `<div class="sw-query-result" data-idx="${i}">${places[i].display_name}</div>`
        }

        if (!html) {
            html = this.options.labels.couldnotgeolocate;
        }

        resultsContainer.html(html);
        jQuery(".sw-query-result").on('click', (evt) => {
            console.log("Result click");
            let idx = jQuery(evt.target).attr("data-idx");

            if (parseInt(idx) == 'isNaN' || idx > this.queryResults.length) {
                console.log("invalid idx widget selected: ", idx);
                return;
            }

            console.log("Setting place");
            let place = this.queryResults[idx];

            this.address.Lat = place.lat;
            this.address.Long = place.lng;

            console.log("selected widget" , this.queryResults[idx]);
            this.centerMap(place.lat, place.lng);
            jQuery("#sw-query-results").html('');
            this.fetchPoints(this.address);
        });
    };
    //
    // ##DJDJ Bpost stuff
    // displayPlaces(places) {
    //     console.log(11);
    //     jQuery(".sw-query-results-description").html('');
    //
    //     this.queryResults = places;
    //     let resultsContainer = jQuery("#sw-query-results");
    //
    //     // ##DJDJ Ovde verovatno treba izmena da se odradi
    //     console.log("Display places");
    //     console.log(places);
    //
    //     let html = '';
    //     for (let i = 0; i < places.length; ++i) {
    //         html += `<div class="sw-query-result" data-idx="${i}">${places[i].display_name}</div>`
    //     }
    //
    //     if (!html) {
    //         html = this.options.couldnotgeolocate;
    //     }
    //
    //     console.log(22);
    //
    //     resultsContainer.html(html);
    //     jQuery(".sw-query-result").on('click', (evt) => {
    //
    //         console.log(33);
    //
    //         let idx = jQuery(evt.target).attr("data-idx");
    //
    //         if (parseInt(idx) == 'isNaN' || idx > this.queryResults.length) {
    //             console.log("invalid idx selected: ", idx);
    //             return;
    //         }
    //
    //         let place = this.queryResults[idx];
    //
    //         this.options.address.Lat = place.lat;
    //         this.options.address.Long = place.lng;
    //
    //         console.log("selected ", this.queryResults[idx]);
    //         jQuery("#sw-query-results").html('');
    //         jQuery("#sw-query").val(place.display_name);
    //         if (typeof(place.address) != 'undefined') {
    //             for (let prop in place.address) {
    //                 if (place.address[prop] && (place.address[prop].length > 0)) {
    //                     this.options.address[prop] = place.address[prop];
    //                 }
    //             }
    //         }
    //         console.log(place.address, "Address is now ", this.options.address);
    //         this.fetchPoints(this.options.address);
    //     });
    // };

    hashLatLng(point) {
        let latstr = (point.lat + '').replace('.', '-');
        let lngstr = (point.lng + '').replace('.', '-');

        return 'r' + latstr + '_' + lngstr;
    };


    displayResults(data) {
        console.log("DisplayPoints22322");
        console.log(data);
        this.mapinterface.clearMarkers();
        jQuery("#sw__container").removeClass('searching');
        this.pickupPointsLoadStop();
        jQuery(".sw-query-results-description").html("<div class='sw-query-results-description'>" + "Displaying the " +  data.Count + "closest points to the given location" + "</div>");

        // ##DJDJ WP exclusive issue because of this
        setTimeout(() => {

        this.pickupPoints = data.Point;
        this.mapChanged = Date.now();

        this.updateList(this.pickupPoints);
        this.mapinterface.addMarkers(this.pickupPoints, (idx) => {
            console.log("Added markers")
            let parent = jQuery("#sw-map-selected-point");
            parent.html("");
            this.addPointInfo(this.pickupPoints[idx], 0, '', parent);
            console.log("added point info")
            this.mapinterface.selectPoint(idx);
            console.log("After select point break")
        });


        }, 100);

    };


    /***
     * Get Points from the API and display them
     **/
    fetchPoints(address, fresolve) {
        // ##DJDJ Ako je block ovo ne treba, ako nije onda treba
        if (!this.isBlockCheckout()){
            this.carrier_id = jQuery('#shipping_carrier_id').val();
            this.setCarrierId(jQuery('#shipping_carrier_id').val());
        }
        // ##DJDJ Ovo dole u else je visak izgleda
        // else {
        //     this.setCarrierId(this.carrier_id);
        // }
        console.log("FetchPoints232222");
        // ##DJDJ Ovde si stao, treba se proslediti carrier id nekako
        console.log(address);
        console.log(this.carrier_id);

        this.selectedPoint = null;

        jQuery("#sw-map-selected-point").html('');
        jQuery('#sw-map-message').removeClass('open');
        jQuery(".sw-query-results-description").html('');

        if (!this.mapinterface.isMapMoving()) {
            jQuery("#sw__container").addClass('searching');
        }

        if (typeof (this.cacheResults[this.hashLatLng({
            lat: this.address.Lat,
            lng: this.address.Long
        })]) != "undefined") {
            console.log("OVDEEEEE");
            this.displayResults(this.cacheResults[this.hashLatLng({lat: this.address.Lat, lng: this.address.Long})]);
        }

        let req = {
            "Address": address,
            "CarrierId": this.carrier_id,
            'action': 'shiptimize_pickup_locations'
        };

        jQuery.getJSON(this.options.ajax_url, req ,  (data)  => {
            console.log("Caoaooo nasaooo");
            console.log(this.options.ajax_url);
            this.mapinterface.clearMarkers();
            console.log(data);
            /* We have the points remove the loader */
            this.pickupPointsLoadStop();

            jQuery("#sw-map-wrapper").removeClass('loading');
            this.searchRunning = false;

            jQuery("#sw__container").removeClass('searching');

            this.searchRunning = false;

            if (data.error) {
                this.displayMessage(data.error);
            }

            if (data.Point) {
                if (data.Point.length > 0) {
                    this.cacheResults[this.hashLatLng({lat: this.address.Lat, lng: this.address.Long})] = data;
                    this.displayResults(data);
                } else {
                    this.displayMessage(this.options.labels.nopoints);
                }
            }

            if (typeof (fresolve) != 'undefined') {
                /* We want to make sure changes are commited to the dom before we declare we're done */
                setTimeout(() => {
                    fresolve();
                }, 300);
            }
        }).fail((err) => {
            this.displayMessage(this.options.labels.nopoints);
            console.log("Fatal error widget requesting points do we have an API bug?", err.responseText);
        });
    };

    geocodeQuery() {
        jQuery("#sw-query-results").html('');

        console.log("Geocode query");

        let queryval = jQuery("#sw-query").val();

        console.log(queryval);

        this.address.Lat = null;
        this.address.Long = null;

        if (queryval.length < 4) {
            return;
        }

        console.log("OVOTITREBA");
        console.log(this.address);
        console.log(this.mapinterface);
        this.mapinterface.geocode({
            "address": queryval,
            "country": this.address.Country
            // ##DJDJ Proveri za Woo da nije sjebano
            // "city": this.options.address.City
        }, (resp) => {
            console.log("Geocodeeee");
            console.log(resp);
            this.displayPlaces(resp);
        });
    };

    /**
     *
     * @param shippingData, the address parts
     * @param f_callback , the function to call when all mighty google returns a result
     */
    geocodeAddress(address, f_callback) {
        console.log(address);
        console.log("GEOCODEADDRESS");
        if (address.country == 'Portugal' && typeof (missingZipPT) != 'undefined') {
            /* Is this a postal code we know is not geocodable in nominatim? */
            let zip4dig = address.postcode.substring(0, 4);
            for (let i = 0; i < missingZipPT.length; ++i) {
                if (missingZipPT[i].zipcode == zip4dig) {
                    this.queryResults = [{
                        display_name: missingZipPT[i].display_name,
                        lat: missingZipPT[i].lat,
                        lng: missingZipPT[i].lng,
                        address: {
                            street: "street",
                            postcode: address.postcode,
                            city: missingZipPT[i].display_name,
                            country_code: address.country,
                        }
                    }];
                    console.log(this.queryResults);
                    f_callback(this.queryResults);
                    return;
                }
            }
        }

        console.log("Nije reseno");
        console.log(this.mapinterface);
        this.mapinterface.geocodeAddressParts( (geocode)  => {
            if (!geocode.lat) {
                return this.mapinterface.geocodeAddressParts( (geocode) => {
                    f_callback(geocode);
                }, address.City, address.Country);
            }

            f_callback(geocode);
        }, address.City, address.Country, address.PostalCode, address.Streetname1);
    };

    mapMoved(mapcenter) {
        jQuery("#sw-point-info").html("");
        return new Promise((resolve, reject) => {
            this.address.Lat = mapcenter.lat;
            this.address.Long = mapcenter.lng;
            this.fetchPoints(this.address, resolve);
        });
    };

    loadLabels(fcallback) {
        jQuery.getJSON(this.options.ajaxLoadLabels, (resp) => {
            this.options.labels = resp;
            fcallback(resp);
        })
            .fail((err) => {
                console.log("error fetching widget labels at " + this.options.ajaxLoadLabels, err);
            });
    };

    loadScripts() {
        console.log("Load scripts widget");
        /* not defined or version < 1.7 compare only subversion for simplicity **/
        if (typeof (jQuery) == 'undefined' || (parseInt(jQuery.fn.jquery.substring(2, 2)) < 7)) {
            console.log("Load scripts widget if");
            var me = this;
            this.loadScript('https://code.jquery.com/jquery-3.7.0.min.js', function () {
                me.scriptsLoaded();
                if (me.options.oninit) {
                    me.options.oninit();
                }
            });
        } else {
            console.log("jquery is widget loaded bootstrap");
            this.scriptsLoaded();
            if (this.options.oninit) {
                this.options.oninit();
            }
        }
    };


    /**
     * @param String url - the url of the script to load
     * @param String callback - the name of the function to call after the script is loaded
     */
    loadScript(url, callback) {
        console.log("Load Script widget singular");
        var script = document.createElement("script");
        script.type = "text/javascript";

        if (script.readyState) { /*IE */
            script.onreadystatechange = () => {
                if (script.readyState == 'loaded' || script.readyState == 'complete') {
                    script.onreadystatechange = null;
                    calback && callback();
                }
            };
        } else {
            script.onload = () => {
                callback && callback();
            };
        }

        script.src = url;
        document.getElementsByTagName("head")[0].appendChild(script);
    };


    /**
     * @param string url
     */
    static loadStyle(url) {

        console.log("LOADDDDD TESTTTTTTT");
        var style = document.createElement('link');
        style.rel = 'stylesheet';
        style.href = url;

        document.getElementsByTagName('head')[0].appendChild(style);
    };

    log(msg, force) {
        if (!force && !this.options.debug) {
            return;
        }

        console.log(msg);
    };

    /**
     * clear any ui elements that result from selection and other state variables
     */
    resetMapElements() {
        this.selectedPoint = null;

        jQuery("#sw-map-selected-point").html('');
        jQuery('#sw-map-message').removeClass('open');
        jQuery(".sw-query-results-description").html('');
    };

    openMap() {
        console.log("Open map widget23222222666666");

        if (!this.isBlockCheckout()){
            var platform = new Woocommerce();
            this.address = platform.getShippingData().Address;

        }


        // console.log(this.carrier_id);
        this.userScroll = jQuery('html,body')
            .scrollTop();

        jQuery('html,body')
            .scrollTop(0);

        jQuery("#sw")
            .addClass("open");
        jQuery("#sw-map-wrapper").addClass('loading');

        console.log("Ovdeee 1");
        // ##DJDJ proveri treba li ovo uopste
        // if (this.getShippingData()) {
        //     let data = this.getShippingData();
        //     this.address = data.Address;
        //     this.carrier_id = data.CarrierId;
        // }

        console.log("Ovdeee 2");

        jQuery("#sw-query").val(this.address.Streetname1);
        this.selectDisplayOption(0);

        console.log("Ovdeee 3");
        console.log(this.address)

        if (this.address.Streetname1) {
            console.log("Ima ulicu");
            if (!this.address.lat) {
                console.log("Nema lat");
                this.geocodeAddress(this.address, (geo) => {
                    console.log("GEOOOOOOOO");
                    console.log(geo);
                    geo.length && (geo = geo[0]);
                    this.address.Lat = geo.lat;
                    this.address.Long = geo.lng;
                    console.log("GEOCODE222");
                    console.log(this.address);
                    this.fetchPoints(this.address);
                });
            } else {
                console.log("Nema ulicu i ide u fetch");
                this.fetchPoints(this.address);
            }
        }
    };

    getShippingData(){
        let shippingData = [];
        this.getBlockShippingData();
        shippingData["Address"] = this.address;
        // shippingData["CarrierId"] = this.carrier_id;
        return shippingData;
    }

    getBlockShippingData(){
        var address = jQuery('#shipping-address_1').val();
        var apartment = jQuery('#shipping-address_2').val();
        var city = jQuery('#shipping-city').val();
        var postalCode = jQuery('#shipping-postcode').val();

        // Extracting Country
        var country = jQuery('#components-form-token-input-0').val();

        console.log("BLOCK SHIPPING DATA");
        console.log(postalCode);

        window.shiptimize_shipping_address =
        {
            "Address":{
                "Lat": "",
                "Long": "",
                "Streetname1": address,
                "Streetname2": '',
                "HouseNumber": apartment,
                "NumberExtension": '',
                "PostalCode": postalCode,
                "s_postcode": postalCode,
                "City": city,
                "Country": country,
                "State": '',

            },
        };
        this.address = window.shiptimize_shipping_address.Address;

    }

    pickupPointsLoadStop() {
        jQuery("#sw-map-wrapper").removeClass('loading');
        this.searchRunning = false;
    };

    /**
     *  Resets the selected point to null
     **/
    resetSelection() {
        this.selectedPoint = null;
    };

    selectPoint(pickup) {
        console.log("Select POINT");
        console.log(pickup);
        this.selectedPoint = pickup;

        localStorage.setItem('ShiptimizePointId', pickup.PointId);
        localStorage.setItem('ShiptimizePointLabel', pickup.Information.Name);

        /** What view are we on ? **/
        let eFieldInfo = jQuery("#sw-map-selected-point");
        if (this.selectedDisplayOption == 1) {
            eFieldInfo = jQuery("#sw-list-points");
        }
        /* Validate if this point requires aditional info that's not present fail here */
        if (typeof (pickup.MapFieldsSelect) != 'undefined' && pickup.MapFieldsSelect.length > 0) {
            let extrasValid = true;
            eFieldInfo.find('.shiptimize_mapfields' + pickup.PointId).each((idx, elem) => {
                let eExtra = jQuery(elem);

                if (!eExtra.val()) {
                    alert(jQuery(jQuery('.shiptimize_mapfieldslabel' + pickup.PointId).get(idx)).text() + ': ' + this.options.labels.mapfieldmandatory);
                    extrasValid = false;
                }
            });

            if (!extrasValid) {
                console.log("point selection widget is not valid, ignoring");
                return false;
            }
        }

        console.log( jQuery(".shiptimize-pickup__description"));
        jQuery(".shiptimize-pickup__description")
            .html(pickup.Information.Name + " " + pickup.Information.Address);

        const pickupPoint = {
            id_carrier: this.carrier_id,
            pickup_id: this.selectedPoint.PointId,
            pickup_label: (this.selectedPoint.Information.Name ? this.selectedPoint.Information.Name + '<br/>' : '') +
                this.selectedPoint.Information.Address,
            action: 'shiptimize_save_pickup'
        };

        /*Is there extra info we want to append? */
        eFieldInfo.find(".shiptimize_mapfields" + this.selectedPoint.PointId).each(function (idx, elem) {
            let fieldid = jQuery(elem).attr('data-id');
            let fieldvalue = jQuery(elem).val();
            pickupPoint['OptionFields'].push({Id: fieldid, Value: fieldvalue});
            localStorage.setItem(fieldid + 'val', fieldvalue);
        });

        if (typeof (this.options.ajax_url) == 'undefined') {
            console.log("Ovdeeee");
            this.options.onPointSelected(pickup, '');
        } else {
            this.platform.setPickupPoint(pickup);
        }

        this.closeMap();
        jQuery("#myModal").hide();
        return true;
    };

    /**
     *  A Point was selected
     *  @param idx - integer the selected index
     **/
    selectPointFromList(idx) {
        if (idx > this.pickupPoints.length || idx < 0) {
            console.log("pointSelected invalid widget index " + idx, 1);
            return;
        }

        this.selectPoint(this.pickupPoints[idx]);
    };


    /***
     * Select the display option
     * @param idx - int -  0: map, 1: list
     */
    selectDisplayOption(idx) {
        console.log("SELECTDISPOPTION");
        console.log(idx);

        let eoptions = jQuery(".sw-display-option, .sw-tab");
        this.selectedDisplayOption = idx;
        eoptions.removeClass('selected');
        jQuery(eoptions.get(idx)).addClass('selected');
        jQuery(jQuery(".sw-tab").get(idx)).addClass('selected');

        if (idx == 0 &&  typeof (this.mapinterface) != 'undefined' && this.mapinterface.pickupPoints.length > 0) {
            this.mapinterface.fitBounds();
        }
    };

    /**
     * Reset the labels initially sent with options
     */
    setLabels(labels) {
        this.options.labels = labels;
    };

    setWeekdayNames(weekdaynames) {
        this.options.labels.weekdaynames = weekdaynames;
    };

    setCarrierId(carrier_id) {
        console.log("Setcarrierid");
        console.log(carrier_id);
        this.carrier_id = carrier_id;
        console.log(this.mapinterface);
        this.mapinterface.setCarrierId(carrier_id);
    };

    /**
     * @param address - object in the same format as we send to the API
     *
     **/
    setAddress(address) {
        if (!address.Streetname1 || !address.Name) {
            console.log("invalid address widget ");
            return;
        }
        this.address = address;
        localStorage.setItem('shiptimizeAddress', JSON.stringify(address));
    };

    /**
     * Called when load scripts ends we must grant that jquery exists
     */
    scriptsLoaded() {
        this.eSearchStatus = jQuery("#search-status");
        this.addMapHtml();

        if (this.options.gmapskey) {
            this.mapinterface = new ShiptimizeGmaps(this.options, this);
        }
        else {
            this.mapinterface = new ShiptimizeOpenMap2(this.options, this);
        }
        this.mapinterface.initMap();
        this.mapinterface.addMapMoveListener((mapcenter) => { return this.mapMoved(mapcenter); });
    };


    updateList(points) {
        jQuery("#sw-list-points").html('');
        let parent = jQuery("#sw-list-points");

        for (let i = 0; i < points.length; ++i) {
            this.addPointInfo(points[i], 0, '', parent);
        }
    }

    getShippingMethodChenge() {
        jQuery(document).ready(() => {
            jQuery("#shiptimize_pickup_button").remove();
            var checkVisibility = setInterval(() => {
                var inputElement =  jQuery("input[name='radio-control-0']");

                if (inputElement.is(':visible')) {

                    // The input element is visible, you can proceed with your script
                    clearInterval(checkVisibility); //
                    inputElement.on('change', () => {
                        console.log("Shipping method changed222222222222222");

                        let aria = jQuery("input[name='radio-control-0']:checked").attr('aria-describedby');

                        let regex = /shipping_shiptimize_[0-9]+:[0-9]+/;

                        // Find the match using the regular expression
                        let match = aria.match(regex);

                        if (match == null){
                            return;
                        }

                        let req = {
                            'action': 'shiptimize_selected_carrier_from_list',
                            'selected_carrier_code': match[0]
                        };

                        jQuery.getJSON(this.options.ajax_url, req ,  (data)  => {
                            console.log("Vrati ga kralju");
                            console.log(data);

                            this.carrier_id = data.carrier_id;
                            window.carrier_id = data.carrier_id;

                            console.log(123);
                            jQuery("#shiptimize_pickup_button").remove();

                            // If not visible, add the button back
                            let inputElement = jQuery(".wc-block-components-shipping-rates-control__package");

                            // ##DJDJ Ovdeee isto trazi po variabli shiptimize_choose_pickup_location ako se pokvari nesto. Proveriti sutra;
                            let button = jQuery("<button class='button alt shiptimize-pick-location' type='button' id='shiptimize_pickup_button' onClick='shiptimize.getPickupLocations(event)'>" + shiptimize_choose_pickup_location + "</button>");

                            inputElement[0].append(button[0]); // Adjust the target container if necessary

                        })

                    })
                }
            })
        })
    }

    getNotBlockFormChange() {

        jQuery('form[name="checkout"] input').change(function() {
            // var fieldName = jQuery(this).attr('name');
            var platform = new Woocommerce();
            this.address = platform.getShippingData();
            console.log(this.address);
            console.log("Form changed");
        });
    }
}

export default ShiptimizeWidget;