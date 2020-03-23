module.exports = {
  'start': {block: false, top: true, right: true, left: true, bottom: true},

  'connected-top-bottom': {block: false, top: true, right: false, left: false, bottom: true},
  'connected-right-left': {block: false, right: true, right: false, left: true, bottom: false},
  'connected-top-right': {block: false, top: true, right: true, left: false, bottom: false},
  'connected-top-left': {block: false, top: true, right: false, left: true, bottom: false},
  'connected-top-bottom-left': {block: false, top: true, right: false, left: true, bottom: true},
  'connected-top-right-left': {block: false, top: true, right: true, left: true, bottom: false},
  'connected-cross': {block: false, top: true, right: true, left: true, bottom: true},

  'deadend-top': {block: true, top: true, right: false, left: false, bottom: false},
  'deadend-right': {block: true, right: true, left: false, bottom: false},
  'deadend-top-right': {block: true, top: true, right: true, left: false, bottom: false},
  'deadend-top-left': {block: true, top: true, right: false, left: true, bottom: false},
  'deadend-top-bottom': {block: true, top: true, right: false, left: false, bottom: true},
  'deadend-right-left': {block: true, right: true, left: true, bottom: false},
  'deadend-top-right-bottom': {block: true, top: true, right: true, left: false, bottom: true},
  'deadend-right-bottom-left': {block: true, bottom: true, right: true, left: true, bottom: false},
  'deadend-cross': {block: true, top: true, right: true, left: true, bottom: true},

  'coal-left': {block: false, top: true, right: false, left: true, bottom: false},
  'coal-right': {block: false, top: true, right: true, left: false, bottom: false},
  'gold': {block: false, top: true, right: true, left: true, bottom: true},
}