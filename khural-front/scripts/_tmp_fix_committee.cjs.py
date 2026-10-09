import io

p = "src/pages/Committee.jsx"
s = io.open(p, encoding="utf-8").read()
total = 0

def rep(old, new, count=1):
    global s, total
    n = s.count(old)
    assert n == count, f"expected {count}, found {n}: {old[:70]!r}"
    s = s.replace(old, new)
    total += n

# A) Повестки по годам
rep(
    """                                      <a
                                        href={agenda.fileLink ? normalizeFilesUrl(agenda.fileLink) : (agenda.fileId ? normalizeFilesUrl(`/files/v2/${agenda.fileId}`) : "#")}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: "#2563eb", textDecoration: "none", fontSize: 15, fontWeight: 500 }}
                                      >
                                        {agenda.title || `Повестка заседания комитета от ${agenda.date || ""} г.`}
                                      </a>""",
    """                                      <button
                                        type="button"
                                        onClick={() =>
                                          setDocPreview({
                                            url: agenda.fileLink
                                              ? normalizeFilesUrl(agenda.fileLink)
                                              : agenda.fileId
                                                ? normalizeFilesUrl(`/files/v2/${agenda.fileId}`)
                                                : "",
                                            title: agenda.title || "Повестка заседания комитета",
                                          })
                                        }
                                        style={{ color: "#2563eb", textDecoration: "underline", fontSize: 15, fontWeight: 500, background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", lineHeight: 1.4 }}
                                      >
                                        {agenda.title || `Повестка заседания комитета от ${agenda.date || ""} г.`}
                                      </button>""",
)

# B) Повестки плоским списком
rep(
    """                                <a
                                  href={agenda.fileLink ? normalizeFilesUrl(agenda.fileLink) : (agenda.fileId ? normalizeFilesUrl(`/files/v2/${agenda.fileId}`) : "#")}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: "#2563eb", textDecoration: "none", fontSize: 15, fontWeight: 500 }}
                                >
                                  {agenda.title || `Повестка от ${agenda.date || ""} г.`}
                                </a>""",
    """                                <button
                                  type="button"
                                  onClick={() =>
                                    setDocPreview({
                                      url: agenda.fileLink
                                        ? normalizeFilesUrl(agenda.fileLink)
                                        : agenda.fileId
                                          ? normalizeFilesUrl(`/files/v2/${agenda.fileId}`)
                                          : "",
                                      title: agenda.title || "Повестка",
                                    })
                                  }
                                  style={{ color: "#2563eb", textDecoration: "underline", fontSize: 15, fontWeight: 500, background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", lineHeight: 1.4 }}
                                >
                                  {agenda.title || `Повестка от ${agenda.date || ""} г.`}
                                </button>""",
)

# C) Отчеты по годам
rep(
    """                                      <a
                                        href={report.fileLink ? normalizeFilesUrl(report.fileLink) : (report.fileId ? normalizeFilesUrl(`/files/v2/${report.fileId}`) : "#")}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: "#2563eb", textDecoration: "none", fontSize: 15, fontWeight: 500 }}
                                      >
                                        {report.title || `Отчет от ${report.date || ""} г.`}
                                      </a>""",
    """                                      <button
                                        type="button"
                                        onClick={() =>
                                          setDocPreview({
                                            url: report.fileLink
                                              ? normalizeFilesUrl(report.fileLink)
                                              : report.fileId
                                                ? normalizeFilesUrl(`/files/v2/${report.fileId}`)
                                                : "",
                                            title: report.title || "Отчет комитета",
                                          })
                                        }
                                        style={{ color: "#2563eb", textDecoration: "underline", fontSize: 15, fontWeight: 500, background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", lineHeight: 1.4 }}
                                      >
                                        {report.title || `Отчет от ${report.date || ""} г.`}
                                      </button>""",
)

# D) Отчеты плоским списком
rep(
    """                                <a
                                  href={report.fileLink ? normalizeFilesUrl(report.fileLink) : (report.fileId ? normalizeFilesUrl(`/files/v2/${report.fileId}`) : "#")}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: "#2563eb", textDecoration: "none", fontSize: 15, fontWeight: 500 }}
                                >
                                  {report.title || `Отчет от ${report.date || ""} г.`}
                                </a>""",
    """                                <button
                                  type="button"
                                  onClick={() =>
                                    setDocPreview({
                                      url: report.fileLink
                                        ? normalizeFilesUrl(report.fileLink)
                                        : report.fileId
                                          ? normalizeFilesUrl(`/files/v2/${report.fileId}`)
                                          : "",
                                      title: report.title || "Отчет комитета",
                                    })
                                  }
                                  style={{ color: "#2563eb", textDecoration: "underline", fontSize: 15, fontWeight: 500, background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", lineHeight: 1.4 }}
                                >
                                  {report.title || `Отчет от ${report.date || ""} г.`}
                                </button>""",
)

# E) Документы комитета (god/grouped view)
rep(
    """                                      {fileUrl ? (
                                        <a
                                          href={fileUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          style={{ color: "#2563eb", textDecoration: "none", fontWeight: 600 }}
                                        >
                                          {doc.title || "Документ без названия"}
                                        </a>
                                      ) : (""",
    """                                      {fileUrl ? (
                                        <button
                                          type="button"
                                          onClick={() => setDocPreview({ url: fileUrl, title: doc.title || "Документ комитета" })}
                                          style={{ color: "#2563eb", textDecoration: "underline", fontWeight: 600, background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", lineHeight: 1.4 }}
                                        >
                                          {doc.title || "Документ без названия"}
                                        </button>
                                      ) : (""",
)

# F/G) Ссылки «Открыть» у связанных документов комитета (2 места, разная индетация)
for indent in ("                                  ", "                              "):
    i2 = indent + "  "
    i3 = indent + "    "
    rep(
        f"""{indent}<a className="btn btn--primary" href={{fileUrl}} target="_blank" rel="noopener noreferrer" download style={{{{ flexShrink: 0 }}}}>
{i2}  Открыть
{i2}</a>""",
        f"""{indent}<span style={{{{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap" }}}}>
{i2}  <button type="button" className="btn btn--primary" onClick={() => setDocPreview({{ url: fileUrl, title: doc.title || "Документ" }})} style={{{{ flexShrink: 0 }}}}>
{i3}    👁 Открыть
{i2}  </button>
{i2}  <a className="btn" href={{fileUrl}} target="_blank" rel="noopener noreferrer" download title="Скачать документ">
{i3}    ⬇
{i2}  </a>
{i2}</span>""",
    )

# H) Планы: «Скачать план» -> предпросмотр + скачивание
rep(
    """                        {(plan.fileLink || plan.fileId) && (
                          <a
                            href={plan.fileLink || `/files/${plan.fileId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn--primary"
                          >
                            Скачать план
                          </a>
                        )}""",
    """                        {(plan.fileLink || plan.fileId) && (
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <button
                              type="button"
                              className="btn btn--primary"
                              onClick={() =>
                                setDocPreview({
                                  url: normalizeFilesUrl(plan.fileLink || `/files/${plan.fileId}`),
                                  title: plan.title || "План комитета",
                                })
                              }
                            >
                              👁 Открыть план
                            </button>
                            <a
                              href={normalizeFilesUrl(plan.fileLink || `/files/${plan.fileId}`)}
                              target="_blank"
                              rel="noopener noreferrer"
                              download
                              className="btn"
                            >
                              ⬇ Скачать
                            </a>
                          </div>
                        )}""",
)

# Модал предпросмотра в конец страницы комитета
rep(
    """          <SideNav links={committeeNavLinks} />
        </div>
      </div>
    </section>
  );
}""",
    """          <SideNav links={committeeNavLinks} />
        </div>
      </div>
      <PdfPreviewModal
        open={Boolean(docPreview)}
        onClose={() => setDocPreview(null)}
        url={docPreview?.url}
        title={docPreview?.title}
      />
    </section>
  );
}""",
)

io.open(p, "w", encoding="utf-8").write(s)
print("replacements done:", total)
