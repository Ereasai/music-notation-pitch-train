
/* VexFlow */
const { Renderer, Stave, StaveNote, Voice, Formatter, Accidental, Beam } = Vex.Flow;

const STAVE_LENGTH      = 80;
const STAVE_XOFFSET     = 10;
const STAVE_BASS_XSTART = 80;

const MIDDLE_C_ABS      = 39;


let btnAction = null;
let gameState = 'start';

let stage     = null;

let notesToDisplay = [];

let problem_answer = null;



document.addEventListener('DOMContentLoaded', init);


function init() {
    btnAction = document.getElementById('btn-action');
    stage     = document.getElementById('stage');

    btnAction.addEventListener('click', () => {
        actionButtonBehavior[gameState]();
    });
}

/**
 * Defines the behavior of the action button.
 */
const actionButtonBehavior = {
    start: () => {
        const MAJOR_PATTERN = "wwwhwwh";
        let patternIndex = 0;

        for (let i = 20; i <= 58; i++) {
            notesToDisplay.push(i);
            if (MAJOR_PATTERN[patternIndex % MAJOR_PATTERN.length] == 'w') i++;
            patternIndex++;
        }

        /* update the stage */
        clearStage();
        loadQuestion();
        stage.classList.remove('flex-center');
        gameState = 'question';
        btnAction.innerText = "Show Answer";
    },


    question: () => {
        revealAnswer();
        gameState = 'answer';
        btnAction.innerText = "Next Question"
    },


    answer: () => {
        clearStage();
        loadQuestion();
        gameState = 'question'
        btnAction.innerText = "Show Answer";
    }
}

/**
 * Picks the next note and generates the SVG of the notation. The `stage` container
 * and the `problem_answer` variable is updated.
 */
function loadQuestion() {
    /* Pick random notes to show */
    let randomIndex = Math.floor(Math.random() * notesToDisplay.length);
    let randomNote = notesToDisplay[randomIndex];
    let problem = convertNoteName(randomNote);
    problem_answer = problem; // need to access the answer when revealing solution.
    console.log(problem);

    // determine which stave to display this problem on.
    let clefToDisplay = null;
    if (randomNote < MIDDLE_C_ABS) {
        clefToDisplay = 'bass';
    } else {
        clefToDisplay = 'treble';
    }

    /* Render notation */
    let output = document.createElement('div');
    output.classList.add('fade-in');

    const renderer = new Renderer(output, Renderer.Backends.SVG);
    renderer.resize(100, 200);
    
    const context = renderer.getContext();

    // create stave and draw.
    const staveTreble = new Stave(STAVE_XOFFSET, 0,  STAVE_LENGTH, {fill_style: 'black'});
          staveTreble  .addClef("treble");
          staveTreble  .setContext(context).draw();
    const staveBass   = new Stave(STAVE_XOFFSET, STAVE_BASS_XSTART, STAVE_LENGTH, {fill_style: 'black'});
          staveBass    .addClef("bass");
          staveBass    .setContext(context).draw();

    // create StaveNote.
    const notes = [
        new StaveNote({keys: [problem],  duration: "1", clef: clefToDisplay, stem: 'down'})
    ];

    // create Voice.
    const voice = new Voice({ num_beats: 1, beat_value: 1 });
    voice.addTickables(notes);
    new Formatter().joinVoices([voice]).format([voice], STAVE_LENGTH);

    // draw everything.
    voice.draw(context, (clefToDisplay == 'treble') ? staveTreble : staveBass);

    /* Move everything to the stage. */
    stage.appendChild(output);
}


function revealAnswer() {
    /* Create element */
    let ans = document.createElement('span');
    ans.innerHTML = problem_answer;
    ans.id = 'answer-lettername';
    ans.classList.add('fade-in');
    stage.appendChild(ans);
}






/* UTILITIES */
/**
 * Clears the div with stage id.
 */
function clearStage() {
    while (stage.firstChild) {
        stage.removeChild(stage.firstChild);
    }
}

/**
 * Given a number btween 0-87, the index of piano key, the function converts it to `note/octave`
 * form and returns it. If the note is a white key, a string is returned. If the note is a black
 * key, a list is returned, containing the `[flat, sharp]` representation of the note.
 * @param {number} absNote 
 * @returns `note/octave` string. If it is a black key, return the 
 */
function convertNoteName(absNote) {
    /* Check for errors */
    // type error
    if (typeof(absNote) != 'number') {
        throw new TypeError("Note value must be a number between 0-87.");
    }
    // out of range
    if (absNote < 0 || absNote > 87) {
        throw new Error("Note value is out of bounds, i.e. doesn't exist on the piano.");
    }

    /* Find the note representation */
    // a white key note is just single character.
    // a black key note is a list, containing the two accidentals.
    const NOTE_ALPHABET = 
        [ 
            'A', 
            ['Bb', 'A#'], 
            'B', 
            'C', 
            ['Db', 'C#'], 
            'D', 
            ['Eb', 'D#'], 
            'E', 
            'F', 
            ['Gb', 'F#'], 
            'G',
            ['Ab', 'G#']
        ];

    let   note   = NOTE_ALPHABET[absNote % 12];
    const octave = Math.floor( (absNote+9) / 12);

    /* Format the output and return */
    // black note: return two representation.
    if (typeof(note) == 'object') {
        return [`${note[0]}/${octave}`,
                `${note[1]}/${octave}`];
    }

    // white note: return one representation.
    return `${note}/${octave}`;
}