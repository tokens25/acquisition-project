  // ── Wireframes ────────────────────────────────────────
  // One map per region, read off the components themselves. Every part is drawn
  // faint and the row's own part is lit, so the picture shows the thing AND
  // where it sits. `furn` is context that has no row of its own here.
  var MAPS = {
    routes: { vb: '0 0 100 42', parts: {
      'index': [4,6,28,30], 'demo 1': [36,6,28,30], 'demo 2': [68,6,28,30]
    }},
    shell: { vb: '0 0 160 104', parts: {
      'page': [0,0,160,104],
      'top bar': [0,0,160,16], 'brand strip': [0,0,60,16], 'mark': [4,4,8,8],
      'product title': [15,5,24,6], 'beta chip': [41,5,10,6], 'collapse control': [52,4,6,8],
      'status bar': [60,0,100,16], 'publish gate': [63,5,32,6], 'action buttons': [100,4,56,8],
      'save note': [0,18,160,5], 'body': [0,25,160,79], 'rail': [0,25,60,79],
      'panel': [2,27,56,75], 'preview pane': [60,25,100,79]
    }},
    actionsDefault: { vb: '0 0 120 22', furn: [[0,0,120,22]], parts: {
      'preview button': [8,6,48,11], 'export button': [62,6,50,11]
    }},
    actionsEdit: { vb: '0 0 120 22', furn: [[0,0,120,22]], parts: {
      'ready for review button': [4,6,36,11], 'approved button': [43,6,28,11],
      'evaluate button': [74,6,42,11]
    }},
    panelDefault: { vb: '0 0 80 121', furn: [[6,5,68,26]], parts: {
      'context fields': [6,36,68,38],
      'market': [6,36,68,6], 'storefront': [6,44,68,6], 'user status': [6,52,68,6],
      'entry point': [6,60,68,6], 'which journey': [6,68,68,6],
      'user flow': [6,78,68,32], 'flow heading': [6,78,26,4], 'flow list': [6,84,68,26],
      'flow item': [8,83,64,11],
      'flow row': [8,84,64,9], 'flow dot': [10,86,5,5], 'flow name': [17,87,26,4],
      'flow skip tag': [46,87,10,4], 'flow edit button': [64,86,6,6], 'flow connector': [11,94,1.5,3],
      'reset progress': [6,113,24,4]
    }},
    panelEdit: { vb: '0 0 80 150', furn: [[6,22,68,18]], parts: {
      'step heading': [6,5,52,7], 'back arrow': [6,5,7,7], 'step title': [16,5,42,7],
      'field group': [6,44,68,16], 'group title': [6,44,26,4],
      'plans group': [6,44,68,16], 'header group': [6,64,68,16],
      'pricing group': [6,84,68,16], 'add-on group': [6,104,68,14],
      'competitions group': [6,122,68,12], 'features group': [6,138,68,10]
    }},
    groupPlans: { vb: '0 0 80 44', parts: {
      'plan tabs': [4,4,72,10], 'plan tab': [4,4,24,10],
      'plan not sold note': [4,18,72,8], 'no plans message': [4,30,72,8]
    }},
    groupHeader: { vb: '0 0 80 78', parts: {
      'badge field': [4,4,72,14], 'ultimate toggle': [4,21,72,12],
      'plan name field': [4,36,72,14],
      'AI pill': [52,52,10,5], 'AI sparkle': [53,53,3,3], 'source tabs': [52,52,24,5], 'description field': [4,59,72,14]
    }},
    groupPricing: { vb: '0 0 80 118', parts: {
      'cadence field': [4,4,72,14], 'apply discount toggle': [4,21,72,12],
      'standard price field': [4,36,72,14], 'discount price field': [4,53,72,14],
      'button field': [4,70,72,14],
      'price explainer field': [4,88,72,16],
      'not sold at this cadence': [4,106,72,9]
    }},
    groupAddon: { vb: '0 0 80 66', parts: {
      'add-on field': [4,4,72,14], 'paid-for field': [4,21,72,14],
      'discount percent field': [4,38,72,14], 'no offer note': [4,55,72,8]
    }},
    groupComps: { vb: '0 0 80 92', parts: {
      'competitions list': [4,4,72,58],
      'competition entry': [4,4,72,27], 'drag handle': [6,6,68,7],
      'position number': [7,7,4,5], 'row logo': [12,6,7,7],
      'row name': [21,8,38,4], 'remove competition': [62,8,11,4],
      'competition name field': [6,15,68,5], 'competition description field': [6,21,68,8],
      'competitions total field': [4,74,72,14]
    }},
    groupFeatures: { vb: '0 0 80 92', parts: {
      'benefit row': [4,4,72,72],
      'benefit picker': [6,6,68,10], 'benefit picker field': [6,6,68,33],
      'benefit picker label': [6,6,14,3], 'benefit picker value': [6,10,68,6],
      'benefit picker text': [16,12,50,3],
      'benefit picker menu': [6,17,68,22], 'benefit option': [8,19,64,5],
      'benefit option icon': [9,20,3,3],
      'icon chooser label': [6,55,8,3],
      'benefit text field': [6,42,68,10],
      'icon chooser': [6,55,68,18], 'suggest icon': [6,55,68,5],
      'icon options': [6,62,68,7], 'icon option': [6,62,7,7],
      'suggestion note': [6,70,50,3],
      'remove benefit': [56,74,16,4],
      'add benefit': [4,82,32,6]
    }},
    overview: { vb: '0 0 160 96', parts: {
      'frames block': [0,0,160,96], 'row caption': [4,4,60,5], 'drag hint': [66,4,38,5],
      'reordered chip': [106,4,22,5], 'reset order': [130,4,18,5],
      'frames row': [0,12,160,82], 'step group': [5,15,48,76],
      'step label': [7,17,22,5], 'state count': [30,17,9,5], 'skip tag': [41,17,9,5],
      'tiles strip': [7,24,44,68], 'tile cell': [8,25,20,68], 'step tile': [8,25,20,62],
      'tile number': [7,17,5,5],
      'browser chrome': [8,80,20,6], 'chrome button': [9,81,4,4],
      'address pill': [14,81,8,4], 'site settings icon': [14.5,82,1.5,2],
      'address text': [17,82,3,2], 'reload icon': [20,82,1.5,2],
      'browser menu': [23,81,4,4],
      'phone status bar': [8,25,20,4], 'status time': [9,26,3,2], 'notch spacer': [14,26,8,2],
      'status levels': [23,26,4,2], 'signal icon': [23,26,1.2,2],
      'wifi icon': [24.4,26,1.2,2], 'battery icon': [25.8,26,1.6,2],
      'screen': [8,30,20,50],
      'thumbnail': [8,30,20,50], 'thumbnail scaler': [9,31,18,48],
      'page clip': [8,30,20,50], 'screen artwork': [8,30,20,58],
      'frame name': [9,79,18,3], 'state label': [8,89,20,4]
    }},
    stepview: { vb: '0 0 160 96', parts: {
      'step preview': [0,0,160,96], 'entry line': [6,5,100,12], 'step name': [6,5,26,5],
      'step meta': [34,5,40,5], 'inbound seeds': [6,11,50,4],
      'viewport': [46,22,68,70], 'placeholder screen': [46,22,68,70],
      'placeholder frame name': [50,26,60,5], 'placeholder states': [50,33,60,4],
      'placeholder gates': [50,39,60,10], 'placeholder note': [50,51,60,4],
      'placeholder warning': [50,57,60,4]
    }},
    card: { vb: '0 0 70 136', parts: {
      'preview area': [0,0,70,136], 'set scroller': [0,0,70,136],
      'card set': [1,1,68,134], 'card': [4,4,62,128],
      'badge': [4,4,28,8], 'card body': [8,14,54,110],
      'card header': [10,16,50,22], 'plan name': [10,16,34,6], 'description': [10,25,50,13],
      'more button': [10,34,14,4], 'card divider': [10,42,50,1.5],
      'pricing': [10,47,50,19], 'price caption': [10,47,20,4],
      'price row': [10,52,50,7], 'price': [10,52,26,7],
      'crossed price': [38,53,14,5], 'price explainer': [10,60,40,3], 'instalment line': [10,63,40,3],
      'plan CTA': [10,68,50,17], 'savings ribbon': [10,68,50,5], 'get button': [10,74,50,11],
      'logo tiles': [10,88,50,10], 'logo tile': [10,88,9,10], 'overflow tile': [51,88,9,10],
      'add-on panel': [10,101,50,11],
      'features list': [10,115,50,10], 'card feature row': [10,115,50,4], 'feature text': [17,115,43,4],
      'card footer': [4,125,62,7]
    }},
    cardDetails: { vb: '0 0 70 122', parts: {
      'popup': [0,0,70,122], 'dimming layer': [0,0,70,122], 'popup panel': [4,4,62,114],
      'close button': [56,4,10,10], 'popup body': [4,4,62,98],
      'popup head': [7,10,56,29],
      'popup intro': [7,10,56,16], 'popup title': [7,10,20,6], 'popup description': [7,18,56,8],
      'popup tabs': [7,29,56,10], 'popup tab': [8,30,27,8],
      'popup list': [7,43,56,58],
      'competition row': [7,43,56,13], 'competition badge': [7,43,13,13],
      'competition copy': [22,44,41,11], 'competition name': [22,44,24,4],
      'competition line': [22,50,41,5],
      'popup features list': [7,43,56,30], 'popup feature row': [7,43,56,4],
      'popup feature text': [12,43,51,4],
      'nothing to show': [7,43,40,5], 'popup footer': [4,104,62,14]
    }},
    cardAddon: { vb: '0 0 60 40', parts: {
      'add-on content': [4,4,52,18], 'add-on artwork': [4,4,12,12],
      'add-on text': [19,4,32,12], 'add-on title': [19,5,30,5], 'add-on subtitle': [19,11,26,4],
      'add-on status': [4,24,30,5], 'add-on divider': [4,31,52,1.5], 'add-on footer': [4,34,52,4]
    }},
    cardStates: { vb: '0 0 70 58', parts: {
      'empty set message': [4,4,62,14], 'measuring probe': [4,22,62,14],
      'header probe': [4,40,62,14]
    }},
    ds: { vb: '0 0 90 84', parts: {
      'text field': [6,5,78,15], 'field label': [10,7,22,4], 'select field': [6,24,78,15],
      'icon': [74,29,6,6], 'toggle field': [6,43,78,13], 'help text': [10,59,42,4],
      'button': [6,66,32,10], 'button label': [11,69,22,4]
    }},
    dsField: { vb: '0 0 90 36', parts: {
      'field body': [4,4,82,26], 'field leading': [8,11,10,12],
      'field control': [20,6,48,22], 'field input': [22,9,44,16],
      'field trailing': [72,11,10,12]
    }},
    dsToggle: { vb: '0 0 90 44', parts: {
      'toggle block': [2,2,86,30], 'toggle row': [6,6,78,22], 'toggle leading': [9,11,10,12],
      'toggle label': [23,14,32,7], 'toggle switch': [60,11,20,12],
      'toggle knob': [71,12,8,10], 'toggle hint': [6,34,54,5]
    }}
  };
