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
      'preview button': [6,6,32,11], 'export button': [42,6,42,11], 'settings button': [88,6,26,11]
    }},
    actionsEdit: { vb: '0 0 120 22', furn: [[0,0,120,22],[98,6,18,11]], parts: {
      'save button': [4,6,42,11], 'exit button': [50,6,44,11]
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
      'breadcrumb': [6,5,52,7], 'scope line': [6,15,44,4],
      'field group': [6,44,68,16], 'group title': [6,44,26,4],
      'plans group': [6,44,68,16], 'header group': [6,64,68,16],
      'pricing group': [6,84,68,16], 'add-on group': [6,104,68,14],
      'competitions group': [6,122,68,12], 'features group': [6,138,68,10]
    }},
    groupPlans: { vb: '0 0 80 44', parts: {
      'plan tabs': [4,4,72,10], 'plan tab': [4,4,24,10],
      'plan not sold note': [4,18,72,8], 'no plans message': [4,30,72,8]
    }},
    groupHeader: { vb: '0 0 80 76', parts: {
      'badge field': [4,4,72,14], 'ultimate toggle': [4,21,72,12],
      'plan name field': [4,36,72,14], 'description field': [4,53,72,20]
    }},
    groupPricing: { vb: '0 0 80 82', parts: {
      'cadence field': [4,4,72,14], 'apply discount toggle': [4,21,72,12],
      'standard price field': [4,36,72,14], 'discount price field': [4,53,72,14],
      'not sold at this cadence': [4,70,72,9]
    }},
    groupAddon: { vb: '0 0 80 66', parts: {
      'add-on field': [4,4,72,14], 'paid-for field': [4,21,72,14],
      'discount percent field': [4,38,72,14], 'no offer note': [4,55,72,8]
    }},
    groupComps: { vb: '0 0 80 54', parts: {
      'logo picker': [4,4,72,22], 'logo button': [4,4,10,10],
      'logo order hint': [4,29,44,4], 'competitions total field': [4,36,72,14]
    }},
    groupFeatures: { vb: '0 0 80 56', parts: {
      'feature row': [4,4,72,34], 'feature picker': [6,6,68,14],
      'line text field': [6,21,68,10], 'remove feature': [56,33,16,4],
      'add feature': [4,44,24,6]
    }},
    overview: { vb: '0 0 160 96', parts: {
      'frames block': [0,0,160,96], 'row caption': [4,4,60,5], 'drag hint': [66,4,38,5],
      'reordered chip': [106,4,22,5], 'reset order': [130,4,18,5],
      'frames row': [0,12,160,82], 'step group': [5,15,48,76],
      'step label': [7,17,22,5], 'state count': [30,17,9,5], 'skip tag': [41,17,9,5],
      'tiles strip': [7,24,44,64], 'step tile': [8,25,20,62], 'tile number': [9,26,5,4],
      'thumbnail': [9,31,18,46], 'thumbnail scaler': [10,32,16,44],
      'frame name': [9,79,18,3], 'state label': [9,83,18,3]
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
      'set scroller': [0,0,70,136], 'card set': [1,1,68,134], 'card': [4,4,62,128],
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
    dsToggle: { vb: '0 0 90 34', parts: {
      'toggle block': [2,2,86,30], 'toggle row': [6,6,78,22], 'toggle leading': [9,11,10,12],
      'toggle label': [23,14,32,7], 'toggle switch': [60,11,20,12],
      'toggle input': [60,11,20,12], 'toggle knob': [71,12,8,10], 'toggle mark': [63,14,5,6]
    }}
  };
