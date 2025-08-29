export const dynamic = 'force-static'

import styles from './swanPoem.module.css'
import Water from '../components/Water'

export default function SwanPoemPage() {
  return (
    <div className="whitepaper-page">
      <Water />
      <img src="/images/swannobackground.png" alt="Swan" className="swan-image" />
      <main className="whitepaper-container">
        <a href="/home" className="home-button">cd home</a>
        <div className="tab-content active" role="document" aria-label="Swan Poem" style={{ overflowX: 'auto', width: 'min(900px, 90vw)' }}>
          <pre className={styles.poem}>
            {`                                        Forttheinnatecuriosmind.                                                    `}
            <span className={styles.hidden}>t</span>
            {`
                                    .ForthemessaroundandfindoutThemistery                                            `}
            <span className={styles.hidden}>y</span>
            {`
                            unwindsasYouplayalongside.QuestssubmergeWithinYou                                       `}
            <span className={styles.hidden}>p</span>
            {`
                        Detectthesigns"8"  "      V888        FillinthegapsFindthe                                  `}
            <span className={styles.hidden}>e</span>
            {`
                      treasurehunt                  V           Hintsandcluesunravel                                `}
            <span className={styles.hidden}>s</span>
            {`
                    astheexplorer                                walksthroughthegate.                               `}
            <span className={styles.hidden}>w</span>
            {`
                    thegalleryis                                  aknotThatunleashesthe                             `}
            <span className={styles.hidden}>a</span>
            {`
                    Cygnuskind.88                                 Befriend"    "thebirdIt                           `}
            <span className={styles.hidden}>n</span>
            {`
                    willbeyourfirst                                ally88"  v8  8Lookthere                           `}
            <span className={styles.hidden}>e</span>
            {`
                    andbeyond.The                                    code   is meanttobreak                         `}
            <span className={styles.hidden}>n</span>
            {`
                     Asthegatesopen                                  again    "moredetails                          `}
            <span className={styles.hidden}>t</span>
            {`
                      willyoufindthere                                       "wpjwwddw32r                            `}
            <span className={styles.hidden}>e</span>
            {`
                        ud89ru32r8yry                                       4uiwdwddw34t                            `}
            <span className={styles.hidden}>r</span>
            {`
                         sfeuhfjdshjhsewatgotoswancomputersydutfiuiojlknjbhgtru67uyokkf
`}
          </pre>
        </div>
      </main>
    </div>
  )
}
