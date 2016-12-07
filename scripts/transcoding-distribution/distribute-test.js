/**
 * Created by aaronphillips on 07/12/2016.
 */

var transcoder = 1;

function getTranscoderValue() {

    if(transcoder === 1) {
        transcoder = 4;
    } else if (transcoder === 4) {
        transcoder = 1;
    }

    return transcoder;
}

// Testing
// console.log(getTranscoderValue());
// console.log(getTranscoderValue());
// console.log(getTranscoderValue());
// console.log(getTranscoderValue());
// console.log(getTranscoderValue());
// console.log(getTranscoderValue());