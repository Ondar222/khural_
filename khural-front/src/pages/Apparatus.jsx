import React from "react";
import UnitModal from "../components/UnitModal.jsx";
import SideNav from "../components/SideNav.jsx";

export default function Apparatus() {
  const [unitModal, setUnitModal] = React.useState(null);
  const [openUnit, setOpenUnit] = React.useState(null);

  // Scroll to a requested unit from URL (e.g., #/apparatus?unit=org)
  React.useEffect(() => {
    const scrollToUnit = () => {
      const h = window.location.hash;
      const sp = new URLSearchParams(h.split("?")[1]);
      const unit = sp.get("unit");
      if (unit && typeof unit === "string") {
        const el = document.getElementById(`unit-${unit}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    };
    scrollToUnit();
    window.addEventListener("hashchange", scrollToUnit);
    return () => window.removeEventListener("hashchange", scrollToUnit);
  }, []);

  const renderUnit = (id, title) => {
    // Simple placeholder card similar to "Представитель Комитета"
    const photo =
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSrm9qv4DwbeHFaIDG39k6DjPnAb8ue71tAJ6ZFX1j5WQbSLbibwC_XiG4x42Zy_dE97Fk&usqp=CAU";
    return (
      <div className="orgv2__committee" id={`unit-${id}`}>
        <div className="person-card person-card--committee">
          <img
            className="person-card__photo"
            src={photo}
            alt=""
            loading="lazy"
          />
          <div className="person-card__body">
            <div className="person-card__name">Представитель подразделения</div>
            <div className="person-card__role">{title}</div>
            <ul className="person-card__meta">
              <li>+7 (959)123‑45‑67</li>
              <li>department@rtyva.ru</li>
              <li>г. Кызыл, ул. Ленина, 40</li>
            </ul>
            <a
              className="btn btn--primary btn--compact"
              href={
                "#/section?title=" + encodeURIComponent(`Подробнее о: ${title}`)
              }
            >
              Подробнее
            </a>
          </div>
        </div>
        <div className="orgv2__actions">
          <a
            href={
              "#/section?title=" + encodeURIComponent(`Подробнее о: ${title}`)
            }
            className="btn btn--primary"
          >
            Подробнее о подразделении
          </a>
        </div>
      </div>
    );
  };

  return (
    <section className="section">
      <div className="container">
        <div className="page-grid">
          <div className="page-grid__main">
            <div className="tabs" style={{ marginTop: 8, marginBottom: 12 }}>
              <a className="pill" href="#/about?tab=structure&focus=overview">
                ← Назад к структуре
              </a>
            </div>
            <h1>Аппарат Верховного Хурала (парламента) Республики Тыва</h1>

            <div className="orgv2">
              {/* Руководитель + заместитель */}
              <div className="orgv2__chain">
                <div className="orgv2__line" />
                <div className="person-card person-card--round-xl">
                  <img
                    className="person-card__photo"
                    src={
                      "https://khural.rtyva.ru/upload/iblock/c37/%D0%A3%D1%81%D0%BF%D1%83%D0%BD%20%D0%9C.%D0%98..jpg" ||
                      "https://www.shutterstock.com/image-vector/default-avatar-profile-icon-vector-600nw-2027875490.jpg"
                    }
                    alt=""
                    loading="lazy"
                  />
                  <div className="person-card__body">
                    <div className="person-card__name">Успун Маадыр Иргитович</div>
                    <div className="person-card__role">
                      Руководитель Аппарата Верховного Хурала (парламента)
                      Республики Тыва
                    </div>
                    <ul className="person-card__meta">
                      <li>+7 (959)123‑45‑67</li>
                      <li>lol@mail.ru</li>
                      <li>г. Кызыл, ул. Ленина, 40</li>
                      <li>Фракция: «ЕДИНАЯ РОССИЯ»</li>
                    </ul>
                    <a
                      className="btn btn--primary btn--compact"
                      href="#/government?type=gov"
                    >
                      Подробнее
                    </a>
                  </div>
                </div>
                <div className="person-card person-card--round-xl">
                  <img
                    className="person-card__photo"
                    src={
                      "https://khural.rtyva.ru/upload/iblock/2d3/IMG_1348.JPG" ||
                      "https://www.shutterstock.com/image-vector/default-avatar-profile-icon-vector-600nw-2027875490.jpg"
                    }
                    alt=""
                    loading="lazy"
                  />
                  <div className="person-card__body">
                    <div className="person-card__name">
                      Ананьина Ирина Викторовна
                    </div>
                    <div className="person-card__role">
                      Заместитель руководителя Аппарата, начальник организационного
                      управления
                    </div>
                    <ul className="person-card__meta">
                      <li>+7 (959)123‑45‑67</li>
                      <li>lol@mail.ru</li>
                      <li>г. Кызыл, ул. Ленина, 40</li>
                    </ul>
                    <a
                      className="btn btn--primary btn--compact"
                      href="#/government?type=gov"
                    >
                      Подробнее
                    </a>
                  </div>
                </div>
              </div>

          {/* Ветка организационного управления */}
          <div className="orgv2__strip" style={{ justifyContent: "center" }}>
            <div
              id="unit-org"
              className="orgv2__unit"
              role="button"
              onClick={() =>
                setUnitModal({
                  title: "Организационное управление аппарата",
                  link: "#/apparatus?unit=org",
                })
              }
            >
              <div className="orgv2__unit_title">
                Организационное управление аппарата
              </div>
              <a
                className="btn btn--primary btn--compact"
                href="#/government?type=gov"
              >
                Подробнее
              </a>
            </div>
          </div>

          <div className="grid cols-1" style={{ gap: 16, marginBottom: 24 }}>
            <div className="person-card person-card--committee">
              <img
                className="person-card__photo"
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSrm9qv4DwbeHFaIDG39k6DjPnAb8ue71tAJ6ZFX1j5WQbSLbibwC_XiG4x42Zy_dE97Fk&usqp=CAU"
                alt=""
                loading="lazy"
              />
              <div className="person-card__body">
                <div className="person-card__name">Ондар Айбина Борисовна</div>
                <div className="person-card__role">
                  Начальник отдела по организационному обеспечению Комитета по
                  государственному строительству и местному самоуправлению
                </div>
                <ul className="person-card__meta">
                  <li>+7 (959)123‑45‑67</li>
                  <li>lol@mail.ru</li>
                  <li>г. Кызыл, ул. Ленина, 40</li>
                </ul>
                <a
                  className="btn btn--primary btn--compact"
                  href="#/government?type=gov"
                >
                  Подробнее
                </a>
              </div>
            </div>
          </div>

          {/* Прочие подразделения аппарата (раскрывающиеся блоки) */}
          <div className="orgv2__list">
            {[
              ["law", "Государственно-правовое управление"],
              ["admin", "Управление делами Аппарата ВХ РТ"],
              ["ia", "Информационно-аналитическое управление"],
              [
                "fin",
                "Управление финансов, бухгалтерского учета и отчетности Аппарата ВХ РТ",
              ],
              [
                "it",
                "Отдел технического и программного обеспечения Аппарата ВХ РТ",
              ],
              ["hr", "Отдел кадров и государственной службы Аппарата ВХ РТ"],
            ].map(([id, title]) => (
              <React.Fragment key={id}>
                <div
                  className={`orgv2__pill orgv2__pill--outline orgv2__pill--button ${
                    openUnit === id ? "orgv2__pill--open" : ""
                  }`}
                  onClick={() => setOpenUnit(openUnit === id ? null : id)}
                >
                  {title}
                </div>
                {openUnit === id ? renderUnit(id, title) : null}
              </React.Fragment>
            ))}
          </div>

          {/* Помощники руководства */}
          <div className="grid cols-1" style={{ gap: 16, marginTop: 24 }}>
            <div className="person-card">
              <img
                className="person-card__photo"
                src="https://khural.rtyva.ru/upload/iblock/a62/DSC_5473.jpg"
                alt=""
                loading="lazy"
              />
              <div className="person-card__body">
                <div className="person-card__name">
                  Орус-оол Амир Донгакович
                </div>
                <div className="person-card__role">
                  Первый помощник Председателя
                </div>
                <ul className="person-card__meta">
                  <li>+7 (959)123‑45‑67</li>
                  <li>lol@mail.ru</li>
                  <li>г. Кызыл, ул. Ленина, 40</li>
                </ul>
                <a
                  className="btn btn--primary btn--compact"
                  href="#/government?type=gov"
                >
                  Подробнее
                </a>
              </div>
            </div>

            <div className="person-card">
              <img
                className="person-card__photo"
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSrm9qv4DwbeHFaIDG39k6DjPnAb8ue71tAJ6ZFX1j5WQbSLbibwC_XiG4x42Zy_dE97Fk&usqp=CAU"
                alt=""
                loading="lazy"
              />
              <div className="person-card__body">
                <div className="person-card__name">Хуурак Кумир Валерьевич</div>
                <div className="person-card__role">Помощник Председателя</div>
                <ul className="person-card__meta">
                  <li>+7 (959)123‑45‑67</li>
                  <li>lol@mail.ru</li>
                  <li>г. Кызыл, ул. Ленина, 40</li>
                </ul>
                <a
                  className="btn btn--primary btn--compact"
                  href="#/government?type=gov"
                >
                  Подробнее
                </a>
              </div>
            </div>

            <div className="person-card">
              <img
                className="person-card__photo"
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSrm9qv4DwbeHFaIDG39k6DjPnAb8ue71tAJ6ZFX1j5WQbSLbibwC_XiG4x42Zy_dE97Fk&usqp=CAU"
                alt=""
                loading="lazy"
              />
              <div className="person-card__body">
                <div className="person-card__name">
                  Ондар Айдын Сарыг-оолович
                </div>
                <div className="person-card__role">
                  Помощник заместителя Председателя
                </div>
                <ul className="person-card__meta">
                  <li>+7 (959)123‑45‑67</li>
                  <li>lol@mail.ru</li>
                  <li>г. Кызыл, ул. Ленина, 40</li>
                </ul>
                <a
                  className="btn btn--primary btn--compact"
                  href="#/government?type=gov"
                >
                  Подробнее
                </a>
              </div>
            </div>
          </div>
            </div>
            <UnitModal
              open={!!unitModal}
              title={unitModal?.title}
              description={unitModal?.description}
              link={unitModal?.link}
              onClose={() => setUnitModal(null)}
            />
          </div>
          <SideNav />
        </div>
      </div>
    </section>
  );
}
