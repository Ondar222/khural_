import React from "react";

export function Feedback() {
  return (
    <section className="section" id="#section">
      <div className="container">
        <h1>Прием обращений</h1>
        <div>
          {" "}
          <h3>Обращения граждан и юридических лиц</h3>
          <p>
            Обращения граждан в адрес Верховного Хурала (парламента) Республики
            Тыва могут быть:
          </p>
          <ul>
            <li>
              <a href="">переданы лично</a>
            </li>
            <li>
              <a href="https://khural.rtyva.ru/internet-priemnaya/letter/">
                отправлены по почте
              </a>
            </li>
            <li>
              <a href="https://khural.rtyva.ru/internet-priemnaya/send/">
                отправлены в электронном виде через официальный сайт
              </a>
            </li>
          </ul>
          <div>
            <p>
              Прежде чем отправить обращение, внимательно ознакомьтесь с{" "}
              <a href="https://khural.rtyva.ru/internet-priemnaya/consideration/">
                порядком рассмотрения обращений{" "}
              </a>
              и следующей информацией:
            </p>
            <ul>
              <li>
                Обращения граждан рассматриваются в течение 30 дней со дня их
                регистрации.
              </li>
              <li>
                По просьбе обратившегося, если обращение передано лично в
                письменной форме, ему выдается расписка с указанием даты приема
                обращения, количества принятых листов и сообщается телефон для
                справок. Никаких отметок на копиях или вторых экземплярах
                принятых обращений не делается.
              </li>
              <li>
                Не принимаются к регистрации анонимные обращения и обращения,
                оформленные с нарушением требований, описанных в{" "}
                <a href="https://khural.rtyva.ru/internet-priemnaya/consideration/">
                  порядке рассмотрения обращений.
                </a>
              </li>
              <li>
                Обращения, в которых содержатся нецензурные либо оскорбительные
                выражения, угрозы жизни, здоровью и имуществу должностного лица,
                а также членов его семьи, остаются без рассмотрения по существу
                поставленных вопросов.
              </li>
              <li>
                Обращения в электронном виде, направляемые минуя предлагаемую{" "}
                <a href="https://khural.rtyva.ru/internet-priemnaya/send/">
                  форму ввода
                </a>
                ,либо на иные электронные адреса к рассмотрению не принимаются.
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div>
        <ul>
          <li>
            <a href="https://khural.rtyva.ru/internet-priemnaya/consideration/">
              Порядок рассмотрения обращений
            </a>
          </li>
          <li>
            <a href="https://khural.rtyva.ru/internet-priemnaya/appeal/">
              Порядок обжалования
            </a>
          </li>
          <li>
            <a href="http://khural.org/internet-priemnaya/legal/">
              Правовое регулирование
            </a>
          </li>
        </ul>
      </div>
    </section>
  );
}

export function Press() {
  return (
    <section className="section">
      <div className="container">
        <h1>Пресс-служба</h1>
        <p>Контакты и релизы пресс-службы.</p>
      </div>
    </section>
  );
}

export function Activity() {
  return (
    <section className="section">
      <div className="container">
        <h1>Деятельность</h1>
        <p>Стратегии, планы и отчеты.</p>
      </div>
    </section>
  );
}

export function Docs() {
  return (
    <section className="section">
      <div className="container">
        <h1>Документы</h1>
        <p>Нормативные документы и справочные материалы.</p>
      </div>
    </section>
  );
}

export function Contacts() {
  return (
    <section className="section">
      <div className="container">
        <h1>Контакты</h1>
        <p>Адреса, телефоны и электронная почта.</p>
      </div>
    </section>
  );
}
