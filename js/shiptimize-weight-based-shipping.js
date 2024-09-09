/** 
 * plug into the  dom and  append shiptimize settings
 * Save on change via ajax 
 * We can't save rule by rule withough pluggin into the checkout 
 * Currently only the instance id is saved 
 */
export default class ShiptimizeWeightBasedShipping {

  constructor() {
    console.log("Shiptimize options for WeightBasedShipping");
    this.init();

  }

  init() {
    //not a shipping method page 
    if (typeof (shiptimize_carrier) == 'undefined') {
      return;
    }

    const regexInstance = /instance_id=([0-9]*)/.exec(window.location.search);

    if (!regexInstance) {
      console.log("invalid url params cannot find instance_id " + window.location.search);
      return;
    }

    this.instance_id = regexInstance[1];
    this.attachShiptimizeOptions();
  }

  /** 
   * Save our options for this instance 
   */
  saveOptions(elem) {
    var data = {
      'data': this.eForm.serializeArray(),
      'instance_id': this.instance_id,
      'action': 'shiptimize_wbs_settings'
    };

    jQuery.post(ajaxurl, data, function (resp) {
      console.log("response ", resp);
    });

    console.log(this.eForm, "Saveoptions ", data);
    
    jQuery(".shiptimize-optionvalues").hide();
    var extraOption = jQuery(".shiptimize-extraoptions").val(); 
    jQuery("#shiptimize-extraoptions"+extraOption).show();
     
  }

  /** 
   * Attach the shiptimize options under the title   
   */
  attachShiptimizeOptions() {

    var eShiptimizeOptions = jQuery("<form id='shiptimizeoptions' class=\"wbs-shiptimizeoptions\"></form>");
    var oHtml = '';

    //no options , nothing to do 
    if (typeof (shiptimize_carrier.OptionList) == 'undefined') {
      return;
    }

    //shiptimize_extraoptions
    //shiptimize_checkboxes
    //Add a Save button 
    let htmlServiceLevels = '';
    let htmlExtraOptions = '';
    let htmlCheckboxes = '';
    let htmlExtravalues = ''; 
    for (var x = 0; x < shiptimize_carrier.OptionList.length; ++x) {
      const option = shiptimize_carrier.OptionList[x];

      if (option.Type == 1) {
        if (typeof (option.OptionValues) != 'undefined') {
          for (var i = 0; i < option.OptionValues.length; ++i) {
            let optionChild = option.OptionValues[i];
            let selected = shiptimize_options['service_level'] == optionChild.Id ? 'selected' : '';
            htmlServiceLevels += "<option value='" + optionChild.Id + "' " + selected + ">" + optionChild.Name + "</option>";
          }
        }
      } else if (shiptimize_extraoptions.includes(option.Id+"")) {
        let selected = shiptimize_options['extraoptions'] == option.Id ? 'selected' : '';
        htmlExtraOptions += "<option value='" + option.Id + "' " + selected + ">" + option.Name + "</option>";
        if (option.OptionFields && option.OptionFields.length>0) {
          for ( var j=0; j<option.OptionFields.length; ++j) {
            if (option.OptionFields[j].OptionValues) { 
              var optionField = option.OptionFields[j]; 
              htmlExtravalues += '<select class="shiptimize-optionvalues" id="shiptimize-extraoptions' + option.Id + '" name="extraoptions' + option.Id + '" onchange=\"shiptimize.platform.wbs.saveOptions(jQuery(this))\">'; 
              for (var i = 0; i < optionField.OptionValues.length; ++i) {
                let optionChild = optionField.OptionValues[i];
                console.log("OptionChild " , optionChild);
                let selected = shiptimize_options['extraoptions' + option.Id] == optionChild.Id ? 'selected' : '';
                htmlExtravalues += "<option value='" + optionChild.Id + "' " + selected + ">" + optionChild.Name + "</option>";
              }
              htmlExtravalues += '</select>'; 
            }
          }
        }
      } else {
        const keys = Object.keys(shiptimize_checkboxes);
        for (var i = 0; i < keys.length; ++i) {
          if (option.Id == keys[i]) {
            let optionName = shiptimize_checkboxes[option.Id];
            let checked = shiptimize_options[optionName] == option.Id ? 'checked' : '';
            htmlCheckboxes += '<span class="wbs-shiptimize-option"><input ' + checked + ' class="wbs-rse-checkbox"  onchange="shiptimize.platform.wbs.saveOptions(jQuery(this))" type="checkbox" name="' + optionName + '" value="' + option.Id + '"/>' + shiptimize_checkboxes[option.Id] + "</span>";
          }
        }
      }
    }

    if (htmlServiceLevels.length > 0) {
      oHtml += "<span class=\"wbs-shiptimize-option\"><label>" + shiptimize_labels.servicelevel + "</label> <select name=\"service_level\"  onchange=\"shiptimize.platform.wbs.saveOptions(jQuery(this))\"><option>-</option>" + htmlServiceLevels + "</select></span>";
    }

    if (htmlExtraOptions.length > 0) {
      oHtml += "<span class=\"wbs-shiptimize-option\"><label>" + shiptimize_labels.extraoptions + "</label> <select class='shiptimize-extraoptions' name=\"extraoptions\"  onchange=\"shiptimize.platform.wbs.saveOptions(jQuery(this))\"><option>-</option>" + htmlExtraOptions + "</select> " + htmlExtravalues+ " </span>";
    }

    oHtml += htmlCheckboxes;

    //Pickup Behaviour?
    if(shiptimize_carrier.HasPickup) {
      let selecthtml = '<select class="shiptimize-extraoptions" name="pickupbehaviour" onchange=\"shiptimize.platform.wbs.saveOptions(jQuery(this))\">';
      for (var x=0; x < 3; ++x) {
        let selected = shiptimize_options['pickupbehaviour'] == x ? 'selected' : '';
        selecthtml += `<option value="${x}" ${selected}>${shiptimize_labels['pickup'+x]}</option>`;
      }
      selecthtml += '</select>';

      oHtml += `<span class=\"wbs-shiptimize-option\"><label>${shiptimize_labels.pickupbehaviour}</label> ${selecthtml}</span>`;
    } 


    if (oHtml.length > 0) {
      eShiptimizeOptions.html("<h3>Shiptimize Settings</h3>" + oHtml);
      eShiptimizeOptions.insertAfter(jQuery("#mainform"));
      this.eForm = jQuery("#shiptimizeoptions"); 
      this.saveOptions(jQuery(".shiptimize-extraoptions"));
    }

  }
}
