import Utils from './shiptimize-utils.js'; 
import ShiptimizeWeightBasedShipping from './shiptimize-weight-based-shipping.js';
export default class WooShiptimizeAdmin {

    constructor() {
        this.wbs = new ShiptimizeWeightBasedShipping();
    }

    bootstrap() { 
        this.urlParams();
    }

    /** 
     * If the export was successfull 
     * @param string appLink - the login url 
     */
    exportSuccess(appLink) {
        if(appLink.trim().length == 0){
            return; 
        }
        
        Utils.openNewWindow(appLink, ''); 
    } 

    /** 
     * @param int id - the carrier id 
     */ 
    getCarrier(id){
        for( let x = 0; x < shiptimize_carriers.length; ++x ){
            if(shiptimize_carriers[x].Id == id){
                return shiptimize_carriers[x]; 
            }
        }
    }

    /** 
     * Show aditional options for carrier 
     */ 
    selectOptions(elem){
        this.selectServiceLevel(elem, jQuery('.shiptimize__service-level').val()); 
        // hide the extra options for now 
        this.selectExtraOptions(elem, jQuery('.shiptimize__extra-options').val());
    }

    /** 
     * @param DomElement  elem - the carrier select 
     */ 
    selectServiceLevel( elem , service_id ) {
        let carrier_id = elem.val(); 
        let carrier = this.getCarrier(carrier_id); 
        let eServiceLevel = elem.siblings(".shiptimize__service-level");

        let options_html = '';

        if( typeof(carrier.OptionList) != undefined ){
            let options = carrier.OptionList; 

            for( let x = 0; x < options.length; ++x){
                if( options[x].Type == 1 && typeof(options[x].OptionValues) != 'undefined' ){  
                    let values = options[x].OptionValues;
                    options_html += "<option>-</option>";
                    for( let i = 0; i < values.length; ++i ){
                        let selected = service_id == values[i].Id ? 'selected' :''; 
                        options_html += "<option value='" + values[i].Id + "' " + selected + " >" + values[i].Name + "</option>";
                    }
                }
            }
        }

        eServiceLevel.html(options_html);
        if(options_html){
            eServiceLevel.addClass("active"); 
        }
        else {
            eServiceLevel.removeClass("active");
        }
    }


    selectExtraOptions( elem, selected_id ){ let carrier_id = elem.val(); 
        let carrier = this.getCarrier(carrier_id); 
        let eExtraoptions = elem.siblings(".shiptimize__extra-options");

        let options_html = '';
        let option_values_html = []; 

        if( typeof(carrier.OptionList) != undefined ){
            let options = carrier.OptionList; 
            for( let x = 0; x < options.length; ++x){
                if( options[x].Type == 0 ){  
                    if(!options_html){
                        options_html += "<option>-</option>";
                    } 
                    let selected = selected_id == options[x].Id ? 'selected' :''; 
                    options_html += "<option value='" + options[x].Id + "' " + selected + " >" + options[x].Name + "</option>"; 
                }

                if (options[x].OptionValues && options[x].OptionValues.length > 0) {
                    var vhtml = '<select id="shiptimize-optionvalues' + options[x].Id +'" class="shiptimize__optionvalues">';
                    for (let j=0; j < options[x].OptionValues.length; ++j) {
                        vhtml += '<option>' + options[x].OptionValues[j] + '</options>';
                    } 

                    vhtml += '<select>';  
                }
            }
        }

        eExtraoptions.html(options_html);
        if(options_html){
            eExtraoptions.addClass("active"); 
        }
        else {
            eExtraoptions.removeClass("active");
        } 
    } 
 
    selectTab(idx){
        jQuery(".nav-tab").removeClass('nav-tab-active');
        jQuery(jQuery(".nav-tab").get(idx)).addClass('nav-tab-active'); 

        jQuery(".tab").removeClass('active'); 
        jQuery(jQuery(".tab").get(idx)).addClass('active');
    }

    accordion(elem){
        let $eparent = jQuery(elem).parent(); 
        if ($eparent.hasClass('open')) {
            $eparent.removeClass('open'); 
        }
        else {
            $eparent.addClass('open');
        }
    }

    /** 
    * Is there stuff in the url params we care about? 
    **/
    urlParams() {
        let parts = document.location.search.split('&'); 
        for (let x = 0; x < parts.length; ++x) {
          let keyval = parts[x].split('='); 
          let key = keyval[0];
          let value = decodeURIComponent(keyval[1]); 

          if(key == 'CallbackURL') {
            console.log("We are creating a label");
            this.openLoader(shiptimize_label_request);

            this.monitorLabelStatus(value);
          }

          if (key == 'Error') {
            console.log("There where errors", value); 
            value = value.replace(/\+/g,' ');
            this.openLoader(value);
            setTimeout( () => {this.closeLoader(); }, 5000);
          }
        }
    }

    /**
     * Request the label status every 1s
     */
    monitorLabelStatus(callbackUrl) {
        var data = {
            'action': 'shiptimize_label_status',
            'callbackUrl': callbackUrl
        };

        console.log("MonitorLabel Status func");

        jQuery.ajax({
            type: "POST",
            url: ajaxurl,
            data: data,
        }).done(data => {
            console.log("Vraceno je posle monitorlabelstatus33333");
            console.log(data);
            var IS_JSON = true;
            try
            {
                var parsedData =  jQuery.parseJSON(data);
            }
            catch(err)
            {
                IS_JSON = false;
            }

            if(IS_JSON && typeof(parsedData.response)!= 'undefined') {

                console.log("Nije undefined");
                console.log(parsedData);
                // Check for falta errors
                if(parsedData.httpCode == '200') {
                    console.log("200 succ");
                    this.loaderMsg(shiptimize_label_request + ' ' + parsedData.response.Finished + '%');
                }
                else {
                    console.log("Error bato");
                    this.loaderMsg("Fatal API error " + parsedData.httpCode);
                    setTimeout(() => { this.closeLoader(); }, 5000);
                    return;
                }

                // Print API errors
                if (parsedData.response.Error.Id > 0) {
                    console.log("Error id > 0");
                    this.loaderMsg(parsedData.response.Error.Info);
                }

                if(parsedData.response.Error.Id == 902) { //No process running
                    console.log("Id 902");
                    setTimeout(() => {
                        this.closeLoader()
                    }, 2000);
                }

                if(parsedData.response.Finished == 100 ) {
                    console.log("Gotovo 100");
                    if ( parsedData.response.LabelFile.length > 0) {
                        let labelinfo = shiptimize_label_click.replace('%',`<a href="${parsedData.response.LabelFile}" target='_blank'>${shiptimize_label_label}</a>`);
                        let noticelist = jQuery("#wp__notice-list");
                        noticelist.removeClass('woocommerce-layout__notice-list-hide');
                        noticelist.append(`<div class="notice notice-info is-dismissible updated">${labelinfo}</div>`);
                        window.open(parsedData.response.LabelFile,'_blank');
                        this.closeLoader();

                        /**
                         * Make sure the info is updated without the need to reload the page
                         */
                        for(var x =0; x < parsedData.response.ClientReferenceCodeList.length; ++x) {
                            var labelresult = parsedData.response.ClientReferenceCodeList[x];
                            if(labelresult.Error.Id == 0) {
                                jQuery("#shiptimize-label" + labelresult.ReferenceCode).addClass('shiptimize-icon-print-printed');
                            }
                            else {
                                jQuery("#shiptimize-label" + labelresult.ReferenceCode).addClass("shiptimize-icon-print-error");
                            }

                            jQuery("#shiptimize-tooltip" + labelresult.ReferenceCode).html(labelresult.message);
                        }
                    }
                    else {
                        let msg = '';
                        for ( var x=0; x < parsedData.response.ClientReferenceCodeList.length; ++x ) {
                            let labelresult = parsedData.response.ClientReferenceCodeList[0];
                            if(labelresult.Error.Id > 0) {
                                msg += "<div class='shiptimize-label-error error'>" + labelresult.Error.Info + "</div>";
                            }
                            jQuery("#shiptimize-label" + labelresult.ReferenceCode).addClass("shiptimize-icon-print-error");
                            jQuery("#shiptimize-tooltip" + labelresult.ReferenceCode).html(labelresult.message);
                        }

                        this.loaderMsg(msg);
                        setTimeout(() => { this.closeLoader(); }, 5000);
                    }
                }

                if(parsedData.response.Finished < 100) {
                    console.log("Okini opet");
                    setTimeout( () => { this.monitorLabelStatus(callbackUrl); }, 2000);
                }
            }
            else {
                this.loaderMsg("The plugin ran into an unexpected error, please try again later. Closing the loader shortly");
                setTimeout( () => {this.closeLoader(); }, 4000);
            }
        })
    }

    loaderMsg(message) {
        jQuery(".shiptimize-loader-message").html(message);
    }

    openLoader(message) {
        jQuery('body').append('<div class="shiptimize-loader-wrapper"><div class="shiptimize-loader"><div></div><div></div><div></div></div><div class="shiptimize-loader-message">' + message  + '</div></div>');
    }

    closeLoader(){
        jQuery(".shiptimize-loader-wrapper").remove();
    }

}