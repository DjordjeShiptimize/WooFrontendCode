import Utils from './shiptimize-utils.js'; 

export default class Woocommerce {

    constructor(ajax_url = "") {
        this.ajax_url = ajax_url;
    }

    /** 
     * @return true if this is the checkout page 
     */
    isCheckout() {
        console.log("Checkout");
        return jQuery("body").hasClass('woocommerce-checkout');
    }

    /* 
     * If there is only one method available woo will use a hidden field for the selected carrier 
     *  + Generic Methods do not have an instance id 
     */ 
    getShippingMethodId(){

        let eCheckbox = jQuery("input[name='shipping_method[0]']:checked");
        let eHidden = jQuery("input[name='shipping_method[0]']");

       // eCheckboxes.addEventListener('change', function(event) {
       //     console.log("Caooooo")
       // });
        let shippingMethod =  eCheckbox.length > 0 ? eCheckbox.val() : eHidden.val() ;


        if ( shippingMethod.indexOf(':') > 0 ){
            var method_parts = shippingMethod.split(':');
            return Utils.removeNonNumeric(method_parts[0]);
        }
        else 
        {
            return shippingMethod;
        } 
    }

    /** 
     * Wordpress won't send session cookies to wp-admin and the session handling in woocommerce is so poorly documented we are better off 
     * extracting necessary info client side our selves. We're emulating their checkout.js 
     * @return an object containing address parts 
     */
    getShippingData() {

        // ##DJDJ Verovatno samo ovde treba da se izmeni i povuku podaci sa pravih idjeva za input text
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

 
        return {
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
    }

    /** 
     * We must run this onload 
     * And on method change 
     * because people may never change the carrier or select a pickup point 
     */ 
    setCarrier(carrier_id){
        console.log("Set carrier id");
        console.log(carrier_id);
        this.carrier_id = typeof(carrier_id) != 'undefined' ? carrier_id : this.getShippingMethodId();  
        jQuery("#shipping_carrier_id").val(this.carrier_id);
    }

    /** 
     * @param Pickup pickup 
     */
    setPickupPoint(pickup) {
        console.log("SET PICKUP POINT @#@#")
        console.log(pickup);
        let pickup_label =  pickup.Information.Name + " " + pickup.Information.Address;

        let req = {
            'action': 'shiptimize_set_pickup_point',
            'shipping_pickup_label':pickup_label,
            'shiptimize_pickup_extended': jQuery('.shiptimize_mapfields' + pickup.PointId).val(),
            'shiptimize-pickup__description': pickup_label,
            'shipping_pickup_id' : pickup.PointId,
            'shipping_carrier_id' : window.carrier_id
        };

        jQuery.getJSON(this.ajax_url, req ,  (data)  => {
            console.log("Uspeooooo sam zemo");
            console.log(data);
        }).fail((err) => {
            console.log("Fatal error widget requesting points do we have an API bug?",err.responseText);
        });

        // ##DJDJ Ovdeee
        // jQuery("#shiptimize-pickup__description").html("Selecetd pickup" + " : " +pickup_label);
        jQuery("#shiptimize-pickup__description").html(shiptimize_select + " : " +pickup_label);
        jQuery("#shipping_pickup_id").val(pickup.PointId);
        jQuery("#shipping_pickup_label").val(pickup_label); 

        jQuery("#shiptimizepickup").val(pickup.PointId); 

        // Is there extra info ? 
        if ( jQuery('.shiptimize_mapfields' + pickup.PointId).length > 0 )  {
            jQuery('#shipping_pickup_extended').val(jQuery('.shiptimize_mapfields' + pickup.PointId).val()); 
        } 
    }
}