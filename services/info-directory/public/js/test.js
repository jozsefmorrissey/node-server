          function doLaundry() {
            clothes = giantHamper;
            goToYourRoom();
            clothes.add(gatherLaundry());
            goToYourDaughtersRoom();
            clothes.add(gatherLaundry());
            .....
            goToTheBasement();
            basementPile.add(clothes);
            while (basementPile.hasClothes()) {
              article = basementPile.getArticle();
              switch (article) {
                white: pile[0].addArticle(article)
                jean: pile[1].addArticle(article)
                color: pile[2].addArticle(article)
                ....
              }
            }
            finished = false;
            pileIndex = 0;
            while (!finished) {
              while (pile[i]) {
                if (dryer.done() && dryer.full()) {
                  clothes = removeClothes();
                  takeToLivingRoom(clothes);
                }
                if (washer.done() && washer.full() && dryer.empty()) {
                  moveToDryer();
                }
                if (washer.empty() && pile.hasClothes()) {
                  addToWasher(pile[i]);
                  startWasher(pile[i].type());
                }
                if (!pile.hasClothes()) {
                  i = i + 1
                }
              }
              foldLaundryForMinutes(45);
            }
          }
