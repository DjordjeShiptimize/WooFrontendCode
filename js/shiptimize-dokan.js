/** 
 * Add any aditional functionality we need in the vendor dashboard 
 */
class ShiptimizeDokan {

  constructor() {}

  export (data) {
    jQuery("<div class='shiptimize-sending'>" + shiptimize_label_sending + "</div>").insertBefore('.shiptimize-export-btn');
    jQuery.ajax({
      url: dokan.ajaxurl,
      method: 'GET',
      data: data,
      success: function (resp) {
        jQuery(".shiptimize-sending").remove();
        jQuery(resp)
          .insertAfter('.shiptimize-export-btn');
      },
      error: function (err) {
        jQuery(".shiptimize-sending").remove();
        jQuery("An error has occurred " + JSON.stringify(err))
          .insertAfter(".shiptimize-export-btn");
      }
    });
  }

  exportSelected() {
    let selectedIds = [];
    jQuery("input[name='bulk_orders[]']:checked")
      .each(function (idx, elem) {
        selectedIds[idx] = jQuery(elem)
          .val();
      });

    if (selectedIds.length == 0) {
      alert("No orders are selected");
      return;
    }
    let data = {
      'action': 'shiptimize_dokan_export_selected',
      'ids': selectedIds
    };

    this.export(data);
  }

  exportAll() {
    let data = {
      'action': 'shiptimize_dokan_export_all'
    };

    this.export(data);
  }
}


jQuery(function () {
  window.shiptimize_dokan = new ShiptimizeDokan();
});
