const INITIAL_WORDS = ['a','again','all','also','and','another','any','around','as','ask','at','back','because','become','before','begin','both','but','by','call','can','change','child','come','could','course','day','develop','each','early','end','even','eye','face','fact','few','first','follow','from','general','get','give','good','govern','group','hand','have','he','head','help','here','high','hold','home','how','however','if','increase','interest','it','know','large','last','lead','leave','life','like','line','little','look','make','man','may','mean','might','more','must','need','never','new','no','now','number','of','off','old','on','one','open','or','order','out','over','own','part','people','person','place','plan','play','point','possible','present','problem','program','public','real','right','run','say','see','seem','show','small','some','stand','state','still','such','system','take','than','that','the','then','there','these','they','thing','think','this','those','time','to','under','up','use','very','way','what','when','where','while','will','with','without','work','world','would','write','you','she','set','we','long','in','many','do','after','which','so','same','other','house','during','much','just','consider','since','should','only','tell','about']

// Referencias a elementos principales del DOM
const $time = document.querySelector('time')
const $paragraph = document.querySelector('p')
const $input = document.querySelector('input')
const $game = document.querySelector('#game')
const $results = document.querySelector('#results')

// Referencias a elementos de estadísticas/resultados
const $correctWords = $results.querySelector('#correct-words')
const $wrongWords = $results.querySelector('#wrong-words')
const $wrongWordsFixed = $results.querySelector('#wrong-words-fixed')
const $correctCharacters = $results.querySelector('#correct-characters')
const $wrongCharacters = $results.querySelector('#wrong-characters')
const $wrongCharactersFixed = $results.querySelector('#wrong-characters-fixed')
const $totalCharacters = $results.querySelector('#results-total-characters')
const $wpm = $results.querySelector('#results-wpm')
const $accuracy = $results.querySelector('#results-accuracy')

// Botón para reiniciar la partida
const $button = document.querySelector('#reload-button')

// Tiempo inicial del juego en segundos
const INITIAL_TIME = 30;

let words = []
let currentTime = INITIAL_TIME
let playing

initGame()
initEvents()

function initGame() {
  // Mostramos la pantalla del juego y ocultamos resultados
  $game.style.display = 'flex'
  $results.style.display = 'none'
  $input.value = ''

  // Indicamos que todavía no se ha empezado a jugar
  playing = false

  // Mezclamos palabras aleatoriamente y tomamos 50
  words = INITIAL_WORDS.toSorted(() => Math.random() - 0.5).slice(0, 50)
  currentTime = INITIAL_TIME

  // Actualizamos el contador visual
  $time.textContent = currentTime

  // Renderizamos cada palabra y cada letra por separado
  // Esto permite marcar letras correctas/incorrectas dinámicamente
  $paragraph.innerHTML = words.map((word, index) => {
    const letters = word.split('')
    return `<word>${letters.map(letter => `<letter>${letter}</letter>`).join('')}</word>`
  }).join('')

  // Activamos la primera palabra y la primera letra
  const $firstWord = $paragraph.querySelector('word')
  $firstWord.classList.add('active')
  $firstWord.querySelector('letter').classList.add('active')
}

function initEvents() {
  // Al presionar cualquier tecla:
  // - enfocamos el input
  // - iniciamos el temporizador una sola vez
  document.addEventListener('keydown', () => {
    $input.focus()
    if (!playing) {
      playing = true

      // Temporizador principal del juego
      const intervalId = setInterval(() => {
        currentTime--
        $time.textContent = currentTime

        // Cuando el tiempo llega a 0 finaliza el juego
        if (currentTime === 0) {
          clearInterval(intervalId)
          gameOver()
        }
      }, 1000)
    }
  })

  // Eventos principales de escritura
  $input.addEventListener('keydown', onKeyDown)
  $input.addEventListener('keyup', onKeyUp)

  // Reiniciar partida
  $button.addEventListener('click', initGame)
}

function onKeyDown(event) {
  // Obtenemos la palabra y letra actualmente activas
  const $currentWord = $paragraph.querySelector('word.active')
  const $currentLetter = $currentWord.querySelector('letter.active')

  const { key } = event

  // Manejo de espacio: pasar a la siguiente palabra
  if (key === ' ') {
    event.preventDefault()

    const $nextWord = $currentWord.nextElementSibling
    const $nextLetter = $nextWord.querySelector('letter')

    // Quitamos estados activos actuales
    $currentWord.classList.remove('active', 'marked')
    $currentLetter.classList.remove('active')

    // Activamos siguiente palabra y letra
    $nextWord.classList.add('active')
    $nextLetter.classList.add('active')

    // Limpiamos el input para la nueva palabra
    $input.value = ''

    // Verificamos si quedaron letras sin escribir correctamente
    const hasMissedLetters = $currentWord.querySelectorAll('letter:not(.correct)').length > 0

    // Marcamos la palabra como correcta o incorrecta
    const classToAdd = hasMissedLetters ? 'marked' : 'correct'
    $currentWord.classList.add(hasMissedLetters ? 'wrong' : null)
    $currentWord.classList.add(classToAdd)

    return
  }

  // Manejo de Backspace
  if (key === 'Backspace') {
    const $prevWord = $currentWord.previousElementSibling
    const $prevLetter = $currentLetter.previousElementSibling

    // Evita retroceder más allá de la primera letra
    if (!$prevWord && !$prevLetter) {
      event.preventDefault()
      return
    }

    // Permite volver a una palabra marcada como incorrecta
    const $wordMarked = $paragraph.querySelector('word.marked')
    if ($wordMarked && !$prevLetter) {
      event.preventDefault()

      // Reactivamos la palabra anterior
      $prevWord.classList.remove('marked')
      $prevWord.classList.add('active')

      const $letterToGo = $prevWord.querySelector('letter:last-child')

      // Movemos el cursor visual a la última letra
      $currentLetter.classList.remove('active')
      $letterToGo.classList.add('active')

      // Reconstruimos el texto escrito previamente
      $input.value = [...$prevWord.querySelectorAll('letter.correct, letter.incorrect')].map($el => {
        return $el.classList.contains('correct') ? $el.innerText : '*'
      }).join('')
    }
  }
}

function onKeyUp() {
  // Recuperamos la palabra y letra activas
  const $currentWord = $paragraph.querySelector('word.active')
  const $currentLetter = $currentWord.querySelector('letter.active')

  const currentWord = $currentWord.innerText.trim()

  // Limitamos la longitud del input al tamaño de la palabra actual
  $input.maxLength = currentWord.length

  const $allLetters = $currentWord.querySelectorAll('letter')

  // Limpiamos estados anteriores antes de recalcular
  $allLetters.forEach($letter => $letter.classList.remove('correct', 'incorrect'))

  // Recorremos cada carácter escrito y validamos
  $input.value.split('').forEach((char, index) => {
    const $letter = $allLetters[index]
    const letterToCheck = currentWord[index]

    const isCorrect = char === letterToCheck
    const letterClass = isCorrect ? 'correct' : 'incorrect'

    // Marcamos visualmente cada letra
    $letter.classList.add(isCorrect ? null : 'wrong')
    $letter.classList.add(letterClass)
  })

  // Movemos el cursor visual de letra activa
  $currentLetter.classList.remove('active', 'is-last')

  const inputLength = $input.value.length
  const $nextActiveLetter = $allLetters[inputLength]

  // Si no quedan letras se marca como última
  $nextActiveLetter ? $nextActiveLetter.classList.add('active') : $currentLetter.classList.add('active', 'is-last')

  // TODO: gameover si no hay próxima palabra
}

function gameOver() {
  // Ocultamos juego y mostramos resultados
  $game.style.display = 'none'
  $results.style.display = 'flex'

  // Estadísticas de palabras
  const correctWords = $paragraph.querySelectorAll('word.correct').length
  const incorrecWords = $paragraph.querySelectorAll('word.marked').length
  const incorrectWordsFixed = $paragraph.querySelectorAll('word.wrong:not(.marked)').length

  // Estadísticas de caracteres
  const correctLetters = $paragraph.querySelectorAll('letter.correct').length
  const incorrectLetters = $paragraph.querySelectorAll('letter.incorrect').length
  const incorrectLettersFixed = $paragraph.querySelectorAll('letter.wrong:not(.incorrect)').length

  const totalLetters = correctLetters + incorrectLetters

  // Cálculo auxiliar de caracteres correctos
  let correctChar = correctLetters + (correctWords - 1);

  // Precisión general del usuario
  const accuracy = ((correctLetters/ (incorrectLetters + incorrectLettersFixed + correctLetters)) * 100)

  // Tiempo efectivo jugado
  const timeSpent = INITIAL_TIME - currentTime

  // Fórmula estándar de Words Per Minute
  // 5 caracteres = 1 palabra
  const wpm = timeSpent > 0 ? (correctLetters / 5) * ( 60 / timeSpent) : 0

  // Mostramos resultados en pantalla
  $correctWords.textContent = correctWords ?? (correctWords * 2) - 1;
  $correctCharacters.textContent = correctLetters ?? correctChar;
  $wrongWords.textContent = incorrecWords;
  $wrongWordsFixed.textContent = incorrectWordsFixed
  $wrongCharacters.textContent = incorrectLetters;
  $wrongCharactersFixed.textContent = incorrectLettersFixed;
  $wpm.textContent = Number(wpm.toFixed(1));
  $accuracy.textContent = `${Number(accuracy.toFixed(1))}%`
}