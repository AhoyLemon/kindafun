Vue.use(VueToast);
Vue.directive('focus', {
  // When the bound element is inserted into the DOM...
  inserted: function (el) {
    // Focus the element
    el.focus();
  }
});

var app = new Vue({
  el: '#app',
  data: {
    gameName: "cameo",
    celebs: allValues,
    isDragging: false,
    my: {
      name: "Lemon",
      score: 0,
      pointsEarnedInFinalRound: 0,
      correctSorts: 0,
      averageValuationOffset: 0,
    },
    game: {
      mode: "",
      started: false,
      finalRound: false,
      over: false
    },
    round: {
      number: 0,
      compareThree: [],
      leftSide: [],
      rightSide: [],
      correctSide: [],
      availableToHire: [],
      guessValueIndex: -1,
      valueGuessed: false,
      budget: 1000,
      spent: 0
    },
    ui: {
      orderConfirmed: false,
      showDragHelp: false,
      valueGuess: 0,
      valueGuessMax: null,
      valueGuessMin: null,
      animateCameoIndex: 0,
      itsTimeToGuessValue: false,
      showNextRoundButton: false,
      showEmailButton: false,
      showBeginFinalRoundButton: false,
      hiringFinished: false,
      countingHireIndex: 0,
      countingInterval: undefined,
      exceededBudget: false,
      cameosPaid: false
    }

  },

  methods: {


    startSinglePlayerGame() {
      const self = this;
      self.game.mode = "singleplayer";
      self.game.started = true;
      self.compareThreeCelebs();
    },

    compareThreeCelebs() {
      const self = this;

      self.round.number++;

      // Find the middle celeb.
      let possibleMiddles = self.celebs.filter(celeb => (celeb.value < 750 && celeb.value > 21));
      let middleCeleb = randomFrom(possibleMiddles);
      let middleValue = middleCeleb.value;

      // Find the most expensive celeb.
      let possibleUppers = self.celebs.filter(celeb => (celeb.value > middleValue));
      let upperCeleb = randomFrom(possibleUppers);
      let upperValue = upperCeleb.value;

      // Find the least expensive celeb.
      let possibleLowers = self.celebs.filter(celeb => (celeb.value < middleValue));
      let lowerCeleb = randomFrom(possibleLowers);
      let lowerValue = lowerCeleb.value;

      let celebs = [
        upperCeleb,
        middleCeleb,
        lowerCeleb
      ];

      self.round.leftSide = [...shuffle(celebs)];
      self.round.rightSide = [];
      self.round.correctSide = [...shuffle(celebs)];
      self.round.correctSide = self.sortByValue(self.round.correctSide);
      self.round.guessValueIndex = ( randomNumber(5,7) - 5);

      $('.list-group.unranked .cameo').addClass('off-table');
      setTimeout(function () {
        $('.list-group.unranked .cameo').addClass('off-table');
      }, 1);
      
      self.showTheGuesses();
      
    },

    dollars(amount) {
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0
      });
      return formatter.format(amount);
    },

    showTheGuesses() {
      const self = this;
      self.ui.animateCameoIndex = 0;
      var intervalId = window.setInterval(function(){
        if (self.ui.animateCameoIndex > self.round.leftSide.length) {
          self.ui.showDragHelp = true;
          clearInterval(intervalId);
        } else {
          self.showAGuessCard();
        }
      }, 1500);
    },

    sortByValue(list) {
      function compare(a, b) {
        if (a.value < b.value) { return 1; }
        if (a.value > b.value) { return -1; }
        return 0;
      }
      if (list && list.length > 1) {
        return list.sort(compare);
      } else {
        return list;
      }
    },

    submitSortOrder() {
      const self = this;
      self.ui.orderConfirmed = true;
      if (self.round.guessValueIndex != 2) {
        const i = (self.round.guessValueIndex + 1);
        self.ui.valueGuess = (self.round.correctSide[i].value + 1);
      } else {
        self.ui.valueGuess = 1;
      }

      if (self.round.guessValueIndex != 0) {
        self.ui.valueGuessMax = (self.round.correctSide[(self.round.guessValueIndex -1)].value - 1);
      } else {
        self.ui.valueGuessMax = "";
      }

      if (self.round.guessValueIndex != 2) {
        self.ui.valueGuessMin = (self.round.correctSide[(self.round.guessValueIndex + 1)].value + 1);
      } else {
        self.ui.valueGuessMin = "";
      }
      
      self.ui.animateCameoIndex = 0;

      var intervalId = window.setInterval(function(){

        if (self.ui.animateCameoIndex > self.round.correctSide.length) {
          clearInterval(intervalId);
          self.ui.itsTimeToGuessValue = true;

        } else {
          self.showAnAnswerCard();
        }
      }, 1500);

      
    },

    submitCameoValueGuess() {
      const self = this;
      const n = self.round.guessValueIndex;
      let offBy = Math.abs(self.ui.valueGuess - self.round.correctSide[self.round.guessValueIndex].value);

      if (self.round.correctSide[n].value == self.ui.valueGuess) {
        self.my.score += 300;
        let instance = Vue.$toast.open(
          {
            message: "<h4>250 Points for bullseye!</h4>",
            type: "info",
            duration: 1500,
            position: "bottom-left"
          }
        );
        soundPerfectValue.play();
      } else if (offBy < 50) {
        let addScore = 200 - (offBy * 4);
        self.my.score += addScore;
        let instance = Vue.$toast.open(
          {
            message: "<h4>"+addScore+" Points for being close</h4>",
            type: "info",
            duration: 1500,
            position: "bottom-left"
          }
        );
        soundCloseValue.play();
      } else {
        let instance = Vue.$toast.open(
          {
            message: "<h4>Off By $"+offBy+"</h4>",
            type: "error",
            duration: 1500,
            position: "bottom-left"
          }
        );
        soundBadValue.play();
      }

      self.round.valueGuessed = true;
      self.ui.itsTimeToGuessValue = false;



      if (self.round.number < settings.maxRounds) {

        setTimeout(function () {
          self.ui.showNextRoundButton = true;
        }, 3000);
        
      } else if (self.round.number >= settings.maxRounds) {
        setTimeout(function () {
          let instance = Vue.$toast.open(
            {
              message: "<h4>You have 1 new email</h4>",
              type: "info",
              duration: 1500,
              position: "bottom-right"
            }
          );
          soundNewEmail.play();
        }, 2000);
        setTimeout(function () {
          self.ui.showEmailButton = true;
        }, 3000);
      }
    },

    startNextRound() {
      const self = this;
      self.clearUI();
      self.round.valueGuessed = false;
      self.round.guessValueIndex = -1;

      self.compareThreeCelebs();
      let instance = Vue.$toast.open(
        {
          message: "<h4>Round "+self.round.number+" begins...</h4>",
          type: "info",
          duration: 1500,
          position: "bottom-right"
        }
      );
    },

    showAGuessCard() {
      const self = this;
      self.ui.animateCameoIndex++;      
      $('.list-group.unranked .cameo:nth-child('+self.ui.animateCameoIndex+')').removeClass('off-table').addClass('animate__animated animate__bounceInUp');
      setTimeout(function () {
        $('.list-group.unranked .cameo:nth-child('+self.ui.animateCameoIndex+')').removeClass('animate__animated animate__bounceInUp');
      }, 1000);
    },

    showAnAnswerCard() {
      const self = this;
      self.ui.animateCameoIndex++;
      let n = (self.ui.animateCameoIndex -1);
      $('.list-group.correct .cameo:nth-child('+self.ui.animateCameoIndex+')').removeClass('off-table').addClass('animate__animated animate__zoomInUp');

      setTimeout(function () {
        $('.list-group.guessed.ranked .cameo:nth-child('+self.ui.animateCameoIndex+')').addClass('colorized');
        if (self.round.rightSide[n] && self.round.correctSide[n]) {
          if (self.round.rightSide[n].slug == self.round.correctSide[n].slug) {
            self.my.score += 100;
            self.my.correctSorts += 1;
            soundCorrect.play();
            let instance = Vue.$toast.open(
              {
                message: "<h4>100 Points for "+self.round.rightSide[n].name+"</h4>",
                type: "info",
                duration: 1500,
                position: "bottom-left"
              }
            );
          } else {
            soundMiss.play();
          }
        }
      }, 1000);
    },

    ////////////////////////////////////////////
    // FINAL ROUND

    showTheEmail() {
      const self = this;
      self.populateFinalRound();
      self.ui.showEmailButton = false;
      $("#EmailFromPasha").removeClass('off-screen');
      
      setTimeout(function () {

        let instance = Vue.$toast.open(
          {
            message: "<h4>"+self.dollars(self.round.budget)+" added to bank account.</h4>",
            type: "info",
            duration: 2500,
            position: "bottom-right"
          }
        );
        self.ui.showBeginFinalRoundButton = true;
      }, 5000);
    },

    beginFinalRound() {
      const self = this;
      self.round.leftSide = self.round.availableToHire;
      self.round.rightSide = [];
      self.game.finalRound = true;
    },

    populateFinalRound() {
      const self = this;
      let celebs = [...shuffle(self.celebs)];
      celebs = celebs.slice(0,10);
      self.round.availableToHire = celebs;

      let costForAll = 0;

      self.round.availableToHire.forEach((cameo,index) => {
        costForAll += cameo.value;
      });

      let avg = parseInt(costForAll / 2);
      if (avg > 1000) {
        self.round.budget = 1000;
      } else if (avg < 500) {
        self.round.budget = 500;
      } else {
        self.round.budget = avg;
      }
      
    },

    finishHiring() {
      const self = this;

      self.round.leftSide = [];
      self.ui.hiringFinished = true;

      self.ui.countingInterval = window.setInterval(function(){

        if (self.ui.countingHireIndex >= self.round.rightSide.length) {
          clearInterval(self.ui.countingInterval);

          setTimeout(function () {
            self.game.finalRound = false;
            self.game.over = true;
          }, 2000);
          
        } else {
          self.showHirePrice();
        }
      }, 3000);

    },

    showHirePrice() {
      const self = this;
      self.ui.countingHireIndex++;
      let n = (self.ui.countingHireIndex -1);
      $('.list-group.hired .cameo:nth-child('+self.ui.countingHireIndex+') .value').removeClass('invisible').addClass('animate__animated animate__bounceIn');

      setTimeout(function () {

        self.round.spent += self.round.rightSide[n].value;

        if (self.round.spent <= self.round.budget) {
          self.my.score += 100;
          self.my.pointsEarnedInFinalRound += 100;
          let instance = Vue.$toast.open(
            {
              message: "<h4>100 Points for "+self.round.rightSide[n].name+"</h4>",
              type: "info",
              duration: 1500,
              position: "bottom-left"
            }
          );
          soundUnderBudget.play();
        } else {
          if (!self.ui.exceededBudget) {
            self.my.score -= self.my.pointsEarnedInFinalRound;
            self.my.pointsEarnedInFinalRound = 0;
            let instance = Vue.$toast.open(
              {
                message: "<h2>"+self.round.rightSide[n].name+" exceeded the budget!</h2>",
                type: "error",
                duration: 1500,
                position: "bottom-left"
              }
            );
            self.ui.exceededBudget = true;
            soundOverBudget.play();
          } else {
            soundFutherOverBudget.play();
          }
        }
      }, 1000);

      setTimeout(function() {
        $('.list-group.hired .cameo:nth-child('+self.ui.countingHireIndex+')').addClass('animate__animated animate__backOutUp');
        setTimeout(function() {
          $('.list-group.hired .cameo:nth-child('+self.ui.countingHireIndex+')').addClass('display-none');
        }, 450);
      }, 2000);


    },

    clearUI() {
      const self = this;
      self.ui.orderConfirmed = false;
      self.ui.showDragHelp = false;
      self.ui.valueGuess = 0;
      self.ui.valueGuessMax =  null;
      self.ui.valueGuessMin =  null;
      self.ui.animateCameoIndex =  0;
      self.ui.itsTimeToGuessValue =  false;
      self.ui.showNextRoundButton = false;
    }




  },

  computed: {
    dragOptions() {
      return {
        animation: 0,
        group: "description",
        //disabled: !this.editable,
        ghostClass: "ghost"
      };
    },
    computedGuessingPhase() {
      const self = this;
      if (self.game.finalRound) {
        if (!self.ui.hiringFinished) {
          return "hiring";
        } else {
          return "calculatingCosts";
        }
      } else {
        if (self.round.leftSide.length > 0 || self.round.rightSide.length < 3) {
          return "sort";
        } else if (!self.ui.orderConfirmed) {
          return "submit";
        } else if (!self.round.valueGuessed) {
          return "answers";
        } else if (self.round.valueGuessed && self.round.number >= settings.maxRounds) {
          return "newMail";
        } else {
          return "finished";
        }
      }
    },
  },

  mounted: function() {
    const self = this;

    /*
    /////////////////////////////////
    // FAKE A FINAL ROUND
    self.populateFinalRound();
    self.my.score = randomNumber(500,5000);
    */


    /*
    /////////////////////////////////
    // FAKE A GAME OVER SCREEN
    let celebs = [...shuffle(self.celebs)];

    const hiredCelebs = randomNumber(3,10);

    celebs = celebs.slice(0,hiredCelebs);
    self.round.rightSide = celebs;

    self.my.score = randomNumber(500,5000);
    self.round.spent = (hiredCelebs * 200);

    if (self.round.spent < self.round.budget) {
      self.my.pointsEarnedInFinalRound = (hiredCelebs * 100);
    }
    self.game.finalRound = false;
    self.game.over = true;
    //
    /////////////////////////////////
    */

  }

});