import './styles/style.css'

gsap.registerPlugin(ScrollTrigger, SplitText);

/* Navbar Scroll Hide/Show */
function navbarScroll() {
  const nav = document.querySelector(".nav");
  let hidden = false;

  ScrollTrigger.create({
    start: 0,
    end: "max",
    onUpdate: (self) => {
      if (self.direction === 1 && !hidden) {
        hidden = true;
        gsap.to(nav, { yPercent: -101, duration: 0.8, ease: "expo.out" });
      } else if (self.direction === -1 && hidden) {
        hidden = false;
        gsap.to(nav, { yPercent: 0, duration: 0.6, ease: "expo.out" });
      }
    }
  });
}

navbarScroll();

/* Text Reveals */
const splitConfig = {
  lines: { duration: 1, stagger: 0.08 },
  words: { duration: 0.6, stagger: 0.08 },
  chars: { duration: 0.4, stagger: 0.01 }
}

function initMaskTextScrollReveal() {
  document.querySelectorAll('[data-split="heading"]').forEach(heading => {
    const type = heading.dataset.splitReveal || 'lines'
    const typesToSplit =
      type === 'lines' ? ['lines'] :
      type === 'words' ? ['lines','words'] :
      ['lines','words','chars']
    
    SplitText.create(heading, {
      type: typesToSplit.join(', '),
      mask: 'lines',
      autoSplit: true,
      linesClass: 'line',
      wordsClass: 'word',
      charsClass: 'letter',
      onSplit: function(instance) {
        const targets = instance[type]
        const config = splitConfig[type]
        
        return gsap.from(targets, {
          yPercent: 110,
          duration: config.duration,
          stagger: config.stagger,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: heading,
            start: 'clamp(top 75%)',
            once: true
          }
        });
      }
    })
  })
}

  let headings = document.querySelectorAll('[data-split="heading"]')
  
  headings.forEach(heading => {
    gsap.set(heading, { autoAlpha: 1 })
  });

initMaskTextScrollReveal()


/* Hero Marquee */
function initMarqueeScrollDirection() {
  document.querySelectorAll('[data-marquee-scroll-direction-target]').forEach((marquee) => {
    // Query marquee elements
    const marqueeContent = marquee.querySelector('[data-marquee-collection-target]');
    const marqueeScroll = marquee.querySelector('[data-marquee-scroll-target]');
    if (!marqueeContent || !marqueeScroll) return;

    // Get data attributes
    const { marqueeSpeed: speed, marqueeDirection: direction, marqueeDuplicate: duplicate, marqueeScrollSpeed: scrollSpeed } = marquee.dataset;

    // Convert data attributes to usable types
    const marqueeSpeedAttr = parseFloat(speed);
    const marqueeDirectionAttr = direction === 'right' ? 1 : -1; // 1 for right, -1 for left
    const duplicateAmount = parseInt(duplicate || 0);
    const scrollSpeedAttr = parseFloat(scrollSpeed);
    const speedMultiplier = window.innerWidth < 479 ? 0.25 : window.innerWidth < 991 ? 0.5 : 1;

    let marqueeSpeed = marqueeSpeedAttr * (marqueeContent.offsetWidth / window.innerWidth) * speedMultiplier;

    // Precompute styles for the scroll container
    marqueeScroll.style.marginLeft = `${scrollSpeedAttr * -1}%`;
    marqueeScroll.style.width = `${(scrollSpeedAttr * 2) + 100}%`;

    // Duplicate marquee content
    if (duplicateAmount > 0) {
      const fragment = document.createDocumentFragment();
      for (let i = 0; i < duplicateAmount; i++) {
        fragment.appendChild(marqueeContent.cloneNode(true));
      }
      marqueeScroll.appendChild(fragment);
    }

    // GSAP animation for marquee content
    const marqueeItems = marquee.querySelectorAll('[data-marquee-collection-target]');
    const animation = gsap.to(marqueeItems, {
      xPercent: -100, // Move completely out of view
      repeat: -1,
      duration: marqueeSpeed,
      ease: 'linear'
    }).totalProgress(0.5);

    // Initialize marquee in the correct direction
    gsap.set(marqueeItems, { xPercent: marqueeDirectionAttr === 1 ? 100 : -100 });
    animation.timeScale(marqueeDirectionAttr); // Set correct direction
    animation.play(); // Start animation immediately

    // Set initial marquee status
    marquee.setAttribute('data-marquee-status', 'normal');

    // ScrollTrigger logic for direction inversion
    ScrollTrigger.create({
      trigger: marquee,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        const isInverted = self.direction === 1; // Scrolling down
        const currentDirection = isInverted ? -marqueeDirectionAttr : marqueeDirectionAttr;

        // Update animation direction and marquee status
        animation.timeScale(currentDirection);
        marquee.setAttribute('data-marquee-status', isInverted ? 'normal' : 'inverted');
      }
    });

    // Extra speed effect on scroll
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: marquee,
        start: '0% 100%',
        end: '100% 0%',
        scrub: 0
      }
    });

    const scrollStart = marqueeDirectionAttr === -1 ? scrollSpeedAttr : -scrollSpeedAttr;
    const scrollEnd = -scrollStart;

    tl.fromTo(marqueeScroll, { x: `${scrollStart}vw` }, { x: `${scrollEnd}vw`, ease: 'none' });
  });
}

initMarqueeScrollDirection();

/* Projects Scroll Interaction */
// function initProjectScroll() {
// const projects = gsap.utils.toArray(".project");
// const media = gsap.utils.toArray(".media");

// let activeIndex = 0;

// function setActive(index) {
//   if (index === activeIndex) return;

//   // Text
//   projects[activeIndex].classList.remove("active");
//   projects[index].classList.add("active");

//   // Media transition
//   gsap.to(media[activeIndex], {
//     opacity: 0,
//     scale: 1.05,
//     duration: 0.8,
//     ease: "power2.out"
//   });

//   gsap.to(media[index], {
//     opacity: 1,
//     scale: 1,
//     duration: 0.8,
//     ease: "power2.out"
//   });

//   activeIndex = index;
// }

// ScrollTrigger.create({
//   trigger: ".projects",
//   start: "top top",
//   end: `+=${projects.length * 100}%`,
//   pin: true,
//   scrub: true,
//   onUpdate: self => {
//     const index = Math.floor(self.progress * projects.length);
//     setActive(Math.min(index, projects.length - 1));
//   }
// });
// }

// initProjectScroll();

/* Directional List Hover Effect */
function initDirectionalListHover() {

  const directionMap = {
    top: 'translateY(-100%)',
    bottom: 'translateY(100%)',
    left: 'translateX(-100%)',
    right: 'translateX(100%)'
  };

  document.querySelectorAll('[data-directional-hover]').forEach(container => {
    const type = container.getAttribute('data-type') || 'all';

    container.querySelectorAll('[data-directional-hover-item]').forEach(item => {
      const tile = item.querySelector('[data-directional-hover-tile]');
      if (!tile) return;

      item.addEventListener('mouseenter', e => {
        const dir = getDirection(e, item, type);
        tile.style.transition = 'none';
        tile.style.transform = directionMap[dir] || 'translate(0, 0)';
        void tile.offsetHeight;
        tile.style.transition = '';
        tile.style.transform = 'translate(0%, 0%)';
        item.setAttribute('data-status', `enter-${dir}`);
      });

      item.addEventListener('mouseleave', e => {
        const dir = getDirection(e, item, type);
        item.setAttribute('data-status', `leave-${dir}`);
        tile.style.transform = directionMap[dir] || 'translate(0, 0)';
      });
    });

    function getDirection(event, el, type) {
      const { left, top, width: w, height: h } = el.getBoundingClientRect();
      const x = event.clientX - left;
      const y = event.clientY - top;

      if (type === 'y') return y < h / 2 ? 'top' : 'bottom';
      if (type === 'x') return x < w / 2 ? 'left' : 'right';

      const distances = {
        top: y,
        right: w - x,
        bottom: h - y,
        left: x
      };

      return Object.entries(distances).reduce((a, b) => (a[1] < b[1] ? a : b))[0];
    }
  });
}

initDirectionalListHover();


/* Studio Image Scale */
function studioGalleryScroll() {
  gsap.to("[img-scale]", {
    width: "100vw",
    ease: "none",
    scrollTrigger: {
      trigger: ".studio-gallery",
      start: "top top",
      pin: true,
      scrub: true,
      anticipatePin: 1,
      onLeave: () => {
        ScrollTrigger.refresh();
      },
      onLeaveBack: () => {
        ScrollTrigger.refresh();
      }
    }
  });
}

studioGalleryScroll();


/* Highlight Text on Scroll */
function initHighlightText(){

  let splitHeadingTargets = document.querySelectorAll("[data-highlight-text]")
  splitHeadingTargets.forEach((heading) => {
    
    const scrollStart = heading.getAttribute("data-highlight-scroll-start") || "top 75%"
    const scrollEnd = heading.getAttribute("data-highlight-scroll-end") || "bottom 60%"
    const fadedValue = heading.getAttribute("data-highlight-fade") || 0.35 // Opacity of letter
    const staggerValue =  heading.getAttribute("data-highlight-stagger") || 0.1 // Smoother reveal
    
    new SplitText(heading, {
      type: "words, chars",
      autoSplit: true,
      onSplit(self) {
        let ctx = gsap.context(() => {
          let tl = gsap.timeline({
            scrollTrigger: {
              scrub: true,
              trigger: heading, 
              start: scrollStart,
              end: scrollEnd
            }
          })
          tl.from(self.chars,{
            autoAlpha: fadedValue,
            stagger: staggerValue,
            ease: "linear"
          })
        });
        return ctx; // return our animations so GSAP can clean them up when onSplit fires
      }
    });    
  });
}

initHighlightText();

/* Industries Color Change */
function industriesScroll() {
  gsap.utils.toArray(".industries-item").forEach((item) => {
    gsap.to(item, {
      color: "#E24431",
      opacity: 1,
      duration: 0.1,
      scrollTrigger: {
        trigger: item,
        start: "top 40%",
        end: "bottom 40%",
        toggleActions: "play reverse play reverse"
      }
    });
  });
}

industriesScroll();

