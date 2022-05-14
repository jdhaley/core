import {Controller} from "../../api/signal.js";
import {controlOf, ownerOf} from "../../base/dom.js";
import {Display, Frame, UserEvent} from "../display.js";

let TRACK: UserEvent = null;

export default {
    input: sense,
    cut: sense,
    copy: sense,
    paste: sense,
    keydown(event: UserEvent) {
        event.shortcut = getShortcut(event);
        if (event.shortcut) {
            event.subject = "command";
        } else {
            event.subject = "charpress";
        }
        sense(event);
    },
    mousedown(event: UserEvent) {
        if (event.ctrlKey) {
            event.subject = "select";
            sense(event);
            return;
        }
        event.subject = "touch";
        sense(event);
        if (event.track) {
//          event.preventDefault();
            TRACK = event;
        } else {
            TRACK = null;
        }
    },    
    mousemove(event: UserEvent) {
        let priorEvent = TRACK;
        if (priorEvent) {
            event.preventDefault();
            event.subject = "drag";
            event.track = priorEvent.track;
            event.moveX = event.x - priorEvent.x;
            event.moveY = event.y - priorEvent.y;
            event.track.send(event);
            TRACK = event;
            return;
        } else {
            event.subject = "moveover";
            sense(event);
        }
    },
    click(event: UserEvent) {
        sense(event);
    },
    dblclick(event: UserEvent) {
        sense(event);
    },
    contextmenu(event: UserEvent) {
        if (event.ctrlKey) event.preventDefault();
    },
    mouseup(event: UserEvent) {
        let priorEvent = TRACK;
        if (priorEvent) {
            event.preventDefault();
            event.subject = "release"
            event.track = priorEvent.track;
            event.moveX = 0;
            event.moveY = 0;
            event.track.send(event);
            TRACK = null;
            return;
        }
    },
    mouseout(event: UserEvent) {
        event.subject = "moveout";
        sense(event);
    }
} as Controller;

function  getShortcut(event: UserEvent) {
    let mod = getModifiers(event);
    let key = event.key as string;
    //If the key being pressed is a modifier, return the modifier combination only.
    if (key == "Control" || key == "Alt" || key == "Shift") return mod;
    //Treat the spacebar as a command key. It can get routed to a charpress later if desired.
    if (key == " ") key = "Space";
    if (mod) return mod + "+" + key;
    return key.length > 1 ? key : "";
}
/**
 * Cross-platform modifier key sensor.
 * TODO: support mouse event (need to sense the buttons rather than key.)
 */
function getModifiers(event: UserEvent) {
    let mod = "";
    let key = event.key as string;
    if (key == " ") key = "Space";
    //We don't differentiate between the Meta Key (apple or windows key) and the Control key.
    if (key == "Meta") key = "Control"; // Apple
    if (event.ctrlKey || event.metaKey) mod += "Control+";
    //Note: The Apple option key is the same as the altKey.
    if (event.altKey) mod += "Alt+";
    //We don't treat the Shift key as a modifier if a character key is pressed.
    //e.g. "Control+a" and "Control+A" are returned.
    //TODO test with Cap Lock for the above. May need to change.
    if (event.shiftKey && (mod || key.length > 1)) mod += "Shift+";
    if (mod.length) mod = mod.substring(0, mod.length - 1);
    return mod;
}

// function sense(event: UserEvent) {
//     let ctl = controlOf(event.target) as Display;
//     if (ctl) {
//         event.direction = "up";
//         event.from = ctl;
//         event.stopPropagation();
//         if (!event.subject) event.subject = event.type;
//         ctl.sense(event);
//         if (!event.subject) event.preventDefault();    
//     }
// }

function sense(event: UserEvent) {
    event.selection = (ownerOf(event.target as Node) as Frame).selectionRange;
    let ctl = controlOf(event.selection.commonAncestorContainer) as Display;
    if (ctl) {
        event.stopPropagation();
        event.direction = "up";
        event.from = ctl;
        event.source = ctl;
        if (!event.subject) event.subject = event.type;
        ctl.sense(event);
        if (!event.subject) event.preventDefault();    
    }
}
