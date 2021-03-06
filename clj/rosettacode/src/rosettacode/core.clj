;; Downloads problems from rosetta code and stores them in a couchdb database
(ns rosettacode.core
  (:require [clj-http.client :as client]
            [clojure.string :as s]
            [cheshire.core :as json])
  (:import [java.net URLEncoder URL])
  (:use [net.cgrand.enlive-html]
        [com.ashafa.clutch :only [create-database with-db
                                  put-document get-document
                                  bulk-update
                                  delete-document get-database]]
        [clojure.pprint]))

(defn fetch-html [url]
  (html-resource (java.net.URL. url))) 

(def root-url "http://rosettacode.org")
(def query-base-url "http://rosettacode.org/mw/api.php?format=json&action=query&prop=revisions&rvprop=content&rvlimit=1&gsrlimit=1&generator=search&rvexpandtemplates=1&gsrsearch=")
(def languages-html (fetch-html "http://rosettacode.org/wiki/Category:Programming_Languages"))

;; Download all the samples for the problems in these categories. 
;; Just chose some popular languages to ensure we cover the most popular problems
(def languages (select languages-html [:#mw-subcategories :li :a]))
(def lang-links (select languages [  #{(attr= :title "Category:C")
                                       (attr= :title "Category:Clojure")
                                       (attr= :title "Category:Java")
                                       (attr= :title "Category:Lisp")
                                       (attr= :title "Category:C++")
                                       (attr= :title "Category:Python")
                                       (attr= :title "Category:Objective-C")}]))

(defn get-url [link]
  (str root-url (:href (:attrs link))))

(def new-urls (map get-url lang-links))
(def problems-html (map fetch-html new-urls))

(defn problems [html]
  (let [links (select html [:#mw-pages :a])]
    (map (comp s/lower-case :title :attrs) links)))

(def problems-list (mapcat problems problems-html))
(def problems-set (into (sorted-set) problems-list))

(defn raw-problem-data [problem-title]
  (let [url (str query-base-url (URLEncoder/encode problem-title))
        resp (:body (client/get url))
        json (json/parse-string resp true)] 
    (if (> (count json) 0)
      (let [pages (-> json :query :pages)
            page-key (first (keys pages))]
        (println (str "Getting samples for: " problem-title))
        (Thread/sleep (+ 500 (rand-int 500)))
        {:title problem-title :data (-> pages page-key :revisions first :*)})
      {:title problem-title :data ""})))


 ;map (comp s/lower-case #(nth % 1))
(defn samples [problem-data]
  (for [[_ lang sample] (re-seq #"(?ms)<lang (.*?)>(.*?)</lang>" (:data problem-data))]
    {:problem (:title problem-data)
     :lang    (s/lower-case lang)
     :samples  [sample]}))


(defn merge-samples [map-coll]
  ;k is the name of language, v is a vector of maps of the form
  ; {:lang k, :problem <problem-title>, :samples [sample1 sample1 ...]}
  (for [[k v] (group-by :lang map-coll)]
     (if (> (count v) 1)
       (apply merge-with (fn [a b]
                           (if (vector? a)
                             (into a b)
                             a))
              v)
       (first v))))


(defn -main
  [& args]
  (let [db (get-database "rosettacode")
        data-coll (map raw-problem-data problems-set)
        docs (map merge-samples (map samples data-coll))]
    (map (partial bulk-update db) docs)))
