import './scss/shiptimize.scss';
import './css/leaflet.css';

import WooCommerce from './js/shiptimize-woo-commerce.js';

import ShiptimizeWidget from "./js/shiptimize-widget";
/** 
 * Class Shiptimize depends on jQuery. 
 * Check if we are meant to append a map 
 * 
 * Platform dependent functions marked with   * @platformDependent 
 */
class Shiptimize {

    constructor(ajax_url) {
        console.log("SHIPTIMIZECONSTRUCT");
        this.markers = []; //pickup {lat, lng} 
        this.isMapLoaded = false;
        this.gmaps_key = typeof(shiptimize_maps_key) == 'undefined' ?  '' : shiptimize_maps_key ;
        this.openMapMarkerIcons = {};
        this.ajax_url = ajax_url; // platform dependent 

        this.platform = new WooCommerce(this.ajax_url);

        this.platform.isCheckout();
        this.init();
    }

    init(){
        console.log("Entered init");
        this.shiptimizeWidget = new ShiptimizeWidget({
            "host": 'https://shiptimize.me',
            "address": this.platform.getShippingData().Address,
            "labels":{},
            "mapParentContainer":'body',
            "buttonParentContainer":'body',
            "buttonClass": '',
            "ajax_url": this.ajax_url,
            "carrierId": this.platform.getShippingData().CarrierId,
            "onPointSelected": () => {},
            "gmapskey": typeof(shiptimize_maps_key) == 'undefined' ?  '' : shiptimize_maps_key
        });
        this.shiptimizeWidget.init();
        console.log("Finished init");
    }

    getPickupLocations(evt) {
        this.shiptimizeWidget.openMap();
    }

}

jQuery(function() {
    if(typeof(woocommerce_params) != 'undefined'){
        window.shiptimize = new Shiptimize(woocommerce_params.ajax_url);
    }
});