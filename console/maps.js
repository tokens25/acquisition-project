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
      'dev mode line': [0,18,160,5], 'body': [0,25,160,79], 'rail': [0,25,60,79],
      'panel': [2,27,56,75], 'preview pane': [60,25,100,79],
      'coach rail': [118,27,40,75]
    }},
    prototype: { vb: '0 0 120 192', furn: [[0,0,120,192]], parts: {
      'prototype': [0,0,120,192], 'prototype stage': [22,2,76,186],
      'prototype phone': [24,2,72,160], 'prototype screen': [24,11,72,141],
      'address bar back': [26,154,7,6],
      'prototype bar': [22,168,76,20],
      'prototype step button': [25,172,12,12],
      'prototype position': [39,172,30,12],
      'screen count': [39,172,30,5], 'screen name': [39,178,22,5],
      'screen state': [62,178,7,5],
      'start again': [71,172,14,12], 'prototype close': [87,172,9,12]
    }},
    actionsDefault: { vb: '0 0 120 22', furn: [[0,0,120,22]], parts: {
      'preview button': [8,6,48,11], 'export button': [62,6,50,11]
    }},
    actionsEdit: { vb: '0 0 120 22', furn: [[0,0,120,22]], parts: {
      'market/dev toggle': [30,5,60,12]
    }},
    panelDefault: { vb: '0 0 80 121', furn: [[6,5,68,26]], parts: {
      'context fields': [6,36,68,30],
      'market': [6,36,68,6], 'user status': [6,44,68,6],
      'entry point': [6,52,68,6], 'which journey': [6,60,68,6],
      'user flow': [6,78,68,32], 'flow heading': [6,78,26,4], 'flow list': [6,84,68,26],
      'flow item': [8,83,64,11],
      'flow row': [8,84,64,9], 'flow dot': [10,86,5,5], 'flow name': [17,87,26,4],
      'flow skip tag': [46,87,10,4], 'flow edit button': [64,86,6,6], 'flow connector': [11,94,1.5,3],
      'hidden steps note': [8,110,40,3],
      'reset progress': [6,113,24,4]
    }},
    panelEdit: { vb: '0 0 80 150', furn: [[6,22,68,18]], parts: {
      'step heading': [6,5,52,7], 'back arrow': [6,5,7,7], 'step title': [16,5,42,7],
      'step status chip': [60,6,14,5], 'nothing ready note': [6,44,68,12],
      'field group': [6,44,68,16], 'group title': [6,44,26,4],
      'plans group': [6,44,68,16], 'header group': [6,64,68,16],
      'pricing group': [6,84,68,16], 'add-on group': [6,104,68,14],
      'competitions group': [6,122,68,12], 'features group': [6,138,68,10],
      'add button': [44,129,28,4]
    }},
    groupPlans: { vb: '0 0 80 44', parts: {
      'plan tabs': [4,4,72,10], 'plan tab': [4,4,24,10],
      'plan not sold note': [4,18,72,8], 'no plans message': [4,30,72,8]
    }},
    groupHeader: { vb: '0 0 80 78', parts: {
      'badge field': [4,4,72,14], 'ultimate toggle': [4,21,72,12],
      'plan name field': [4,36,72,14],
      'AI pill': [52,52,10,5], 'AI sparkle': [53,53,3,3], 'source tabs': [52,52,24,5],
      'source label': [30,52,18,5], 'description field': [4,59,72,14]
    }},
    groupPricing: { vb: '0 0 80 136', parts: {
      'standard price field': [4,4,72,14], 'currency mark': [7,8,5,6],
      'price unit field': [4,21,72,14], 'apply discount toggle': [4,38,72,12],
      'discount price field': [4,53,72,14],
      'price explainer field': [4,70,72,16],
      'button field': [4,90,72,14], 'button savings menu': [4,107,72,14],
      'not sold at this cadence': [4,124,72,9]
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

    flowShared: { vb: '0 0 80 120', parts: {
      'screen frame': [4,4,72,112], 'screen header': [4,4,72,10],
      'screen back arrow': [6,5,7,7], 'screen title': [22,6,36,5], 'screen brand': [66,5,7,7], 'screen result mark': [26,3,5,5],
      'screen body': [4,16,72,100],
      'screen field': [8,20,64,12], 'field row': [8,20,64,12],
      'field contents': [14,22,44,8], 'field name': [14,22,24,3], 'field text box': [14,26,30,4], 'field value': [14,26,30,4],
      'field mark': [64,24,5,5],
      'field pair': [8,36,64,22],
      'screen button': [8,62,64,10], 'screen divider': [8,76,64,5]
    }},
    flowLanding: { vb: '0 0 80 120', parts: {
      'landing screen': [0,0,80,120], 'hero glow': [0,0,80,105],
      'hero picture': [0,0,80,110], 'hero artwork': [0,0,80,110], 'landing wash': [0,0,80,110],
      'hero content slot': [3,58,74,46], 'hero content': [3,58,74,46],
      'landing heading': [7,60,66,7], 'landing body group': [7,69,66,12],
      'landing body': [7,70,66,10],
      'landing buttons': [7,84,66,22], 'button and note stack': [7,84,66,22],
      'landing button group': [7,84,66,16], 'landing button': [7,84,66,7],
      'landing footnote': [7,101,66,4],
      'landing bar': [0,0,80,10], 'landing brand': [3,2,7,7],
      'landing bar buttons': [40,2,36,7], 'landing bar button': [40,2,17,7]
    }},
    flowLandingPage: { vb: '0 0 80 220', parts: {
      'landing page': [0,0,80,220],
      'postcode block': [0,2,80,24], 'postcode copy': [4,4,72,9],
      'postcode heading': [4,4,72,4], 'postcode note': [4,9,72,4],
      'postcode row': [4,16,72,8], 'postcode field': [4,16,44,8],
      'postcode label': [6,18,16,4], 'postcode value': [30,18,16,4],
      'postcode edit glyph': [43,18,4,4], 'postcode button': [50,16,26,8],
      'page plan picker': [0,28,80,34],
      'schedule block': [0,26,80,32], 'schedule heading band': [0,26,80,10],
      'schedule heading': [4,28,60,6], 'schedule row': [0,38,80,20],
      'fixture': [4,38,34,20], 'fixture picture': [4,38,34,12],
      'fixture artwork': [4,38,34,12], 'fixture timestamp': [5,39,10,3],
      'fixture reminder': [33,39,4,4], 'fixture playback': [4,46,34,4],
      'fixture time left': [26,46,12,3], 'fixture play glyph': [26,46,3,3],
      'fixture scrub track': [4,49,34,1], 'fixture scrub': [4,49,20,1],
      'fixture words': [4,51,34,7], 'fixture title': [4,51,34,3],
      'fixture subtitle': [4,55,34,3], 'fixture label': [4,55,8,3],
      'plans heading block': [4,60,72,10], 'plans heading': [4,60,72,6],
      'plans tabs row': [4,72,72,6],
      'plans subheading': [4,67,72,3],
      'teams block': [0,80,80,26], 'teams words': [4,82,72,9],
      'teams eyebrow': [30,82,20,3], 'teams heading': [4,86,72,5],
      'teams subheading': [4,92,72,3],
      'teams rail': [4,96,76,9], 'team tile': [4,96,16,9],
      'team plate': [4,96,16,9], 'team crest': [8,98,8,4],
      'team wash': [4,102,16,3], 'team words': [5,102,10,3],
      'team city': [5,102,8,1], 'team name': [5,103,8,2],
      'team template': [22,96,16,9], 'team template label': [22,106,16,2],
      'out-of-area block': [0,108,80,30], 'out-of-area card': [4,110,72,26],
      'out-of-area heading': [8,113,64,5], 'out-of-area body': [8,119,64,4],
      'out-of-area field': [8,124,64,7], 'out-of-area pin': [9,126,4,4],
      'out-of-area entry': [15,125,44,5], 'out-of-area field label': [15,125,44,2],
      'out-of-area value': [15,127,44,3], 'out-of-area clear': [64,126,5,5],
      'out-of-area notice': [8,132,64,4], 'out-of-area note': [8,136,64,4],
      'out-of-area button': [8,141,64,6],
      'multiview block': [4,96,72,26],
      'providers block': [4,126,72,44], 'provider grid': [4,140,72,24],
      'provider tile': [4,140,34,7],
      'devices block': [4,174,72,18],
      'free games block': [4,196,72,10],
      'questions block': [4,208,72,10], 'question list': [4,208,72,10],
      'question': [4,208,72,4],
      'page section heading': [4,66,72,6], 'page section body': [4,74,72,6],
      'page section note': [4,84,72,4], 'page eyebrow': [4,60,40,4],
      'plan-only pill': [30,60,14,4], 'gold half sentence': [30,80,26,4]
    }},
    flowSubscription: { vb: '0 0 80 160', furn: [[0,0,80,12]], parts: {
      'subscription control': [5,20,70,11], 'subscription tabs': [5,20,70,11],
      'subscription tab': [6,21,33,9], 'ultimate bolt': [44,23,5,5],
      'tab sparkle': [41,20,34,10],
      'subscription cards': [5,38,70,104]
    }},
    flowCadence: { vb: '0 0 80 100', parts: {
      'ways to pay': [4,4,72,74],
      'pay options': [4,4,72,50], 'pay option': [4,4,72,23],
      'option radio': [7,8,6,6], 'option text': [16,7,50,17],
      'option name': [16,7,22,4], 'option note': [16,12,44,3], 'option price': [16,17,26,6],
      'option amount': [16,17,14,6], 'option unit': [32,19,8,4],
      'option saving': [42,18,22,5],
      'option ribbon': [50,2,26,5],
      'cadence footnote': [4,84,72,6]
    }},
    flowAuth: { vb: '0 0 80 120', parts: {
      'login screen': [4,2,72,116],
      'login mark': [36,2,8,8],
      'login title block': [4,13,72,14], 'login heading': [4,13,72,6], 'login subheading': [4,21,72,6],
      'login notice': [4,30,72,14], 'notice heading': [7,33,66,4], 'notice body': [12,38,61,4],
      'login form': [4,48,72,68],
      'provider buttons': [4,80,72,36], 'provider button': [4,80,72,10]
    }},
    flowAccount: { vb: '0 0 80 132', parts: {
      'account screen': [4,2,72,128],
      'account fields': [4,2,72,112],
      'account section': [4,2,72,22], 'account section heading': [4,2,26,4],
      'password checklist': [4,62,72,18], 'checklist heading': [4,62,34,4],
      'checklist rule': [4,68,60,4],
      'consent box': [4,86,72,20], 'consent text': [8,90,48,12],
      'consent switch': [60,93,12,7], 'consent knob': [66,94,5,5],
      'consent note': [4,108,52,4]
    }},
    flowZip: { vb: '0 0 80 116', parts: {
      'zip screen': [4,2,72,112],
      'zip intro': [4,2,72,20], 'zip heading': [4,2,72,6], 'zip body': [4,10,72,12],
      'zip results': [4,42,72,30], 'zip results heading': [4,42,30,4],
      'zip team grid': [4,50,72,22], 'zip team': [4,50,12,12]
    }},
    flowCheckout: { vb: '0 0 80 180', parts: {
      'checkout screen': [4,2,72,176],
      'checkout note': [4,2,72,6],
      'purchase summary': [4,12,72,46],
      'summary heading': [4,12,72,10], 'summary title': [7,14,20,5], 'change button': [58,14,15,6],
      'summary line': [4,24,72,8], 'line label': [7,26,30,4], 'line amount': [58,26,15,4],
      'line unit': [68,26,5,4],
      'renewal note': [4,48,72,8],
      'payment card': [4,62,72,104],
      'payment option': [7,64,66,8], 'payment option name': [7,64,34,8],
      'payment marks': [50,65,23,6], 'more cards chip': [66,65,7,5],
      'card details': [7,74,66,72], 'field pair row': [7,88,66,10],
      'legal text': [7,100,66,14], 'option spacer': [7,150,66,3],
      'promo row': [4,170,72,8], 'promo label': [10,172,40,4]
    }},
    flowReady: { vb: '0 0 80 90', parts: {
      'confirmation screen': [4,6,72,78],
      'confirmation content': [4,6,72,44],
      'team circles': [16,6,48,14], 'team circle': [16,6,12,12],
      'confirmation words': [8,54,64,16], 'confirmation heading': [4,24,72,12], 'confirmation body': [4,38,72,10],
      'confirmation buttons': [4,58,72,24]
    }},
    stepview: { vb: '0 0 160 96', parts: {
      'step preview': [0,0,160,96], 'entry line': [6,5,100,12], 'step name': [6,5,26,5],
      'step meta': [34,5,40,5], 'inbound seeds': [6,11,50,4],
      'viewport': [46,22,68,70], 'placeholder screen': [46,22,68,70],
      'placeholder frame name': [50,26,60,5], 'placeholder states': [50,33,60,4],
      'placeholder gates': [50,39,60,10], 'placeholder note': [50,51,60,4],
      'placeholder warning': [50,57,60,4],
      'state row': [46,22,68,74], 'one state': [46,22,20,74], 'state name': [46,92,20,4]
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
      'button': [6,66,32,10], 'button label': [11,69,22,4],
      'translation note': [10,59,64,4], 'translation state': [10,59,14,4],
      'translation text': [26,59,28,4], 'translation actions': [56,59,18,4],
      'translation action': [56,59,8,4]
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
