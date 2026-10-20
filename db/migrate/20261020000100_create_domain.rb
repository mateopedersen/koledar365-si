class CreateDomain < ActiveRecord::Migration[8.1]
  def change
    create_table :sources do |t|
      t.string :key, null: false; t.string :url; t.string :title; t.string :status, default: "imported"
      t.date :accessed_on; t.string :version; t.json :metadata, default: {}; t.timestamps
    end
    add_index :sources, :key, unique: true
    create_table :pages do |t|
      t.string :path, null: false; t.string :title, null: false; t.string :family
      t.integer :year; t.integer :month; t.string :status, default: "draft"
      t.text :body; t.text :description; t.json :metadata, default: {}; t.timestamps
    end
    add_index :pages, :path, unique: true
    create_table :person_names do |t|
      t.string :name_id, null: false; t.string :exact, null: false; t.string :slug, null: false
      t.string :folded, null: false; t.integer :priority, null: false; t.string :status, default: "draft"
      t.json :observations, default: {}; t.json :qa, default: {}; t.timestamps
    end
    add_index :person_names, :name_id, unique: true
    add_index :person_names, :exact, unique: true
    add_index :person_names, :slug, unique: true
    add_index :person_names, [:status, :priority]
    create_table :calendar_events do |t|
      t.string :key, null: false; t.string :slug; t.string :title, null: false; t.date :on, null: false
      t.date :ends_on; t.boolean :work_free, default: false; t.boolean :state_holiday, default: false
      t.string :category; t.string :source_url; t.json :metadata, default: {}; t.timestamps
    end
    add_index :calendar_events, :key, unique: true
    add_index :calendar_events, :on
    create_table :astronomical_events do |t|
      t.string :key, null: false; t.string :kind; t.string :title
      t.datetime :instant, null: false; t.string :source_url; t.timestamps
    end
    add_index :astronomical_events, :key, unique: true
    add_index :astronomical_events, :instant
    create_table :horoscopes do |t|
      t.string :sign, null: false; t.date :local_date, null: false; t.string :locale, default: "sl", null: false
      t.text :body, null: false; t.string :status, default: "draft"; t.string :editor
      t.datetime :published_at; t.timestamps
    end
    add_index :horoscopes, [:sign, :local_date, :locale], unique: true
    create_table :print_requests do |t|
      t.string :fingerprint, null: false; t.string :status, default: "queued"
      t.json :options, default: {}; t.json :files, default: {}; t.text :error
      t.boolean :private_file, default: false; t.string :owner_token; t.integer :attempts, default: 0
      t.datetime :expires_at; t.datetime :started_at; t.datetime :finished_at; t.timestamps
    end
    add_index :print_requests, :fingerprint, unique: true
    create_table :contact_messages do |t|
      t.string :name; t.string :email; t.text :message; t.string :status, default: "new"; t.timestamps
    end
    create_table :admins do |t|
      t.string :email, null: false; t.string :password_digest, null: false; t.timestamps
    end
    add_index :admins, :email, unique: true
    create_table :audit_logs do |t|
      t.string :action; t.string :actor; t.json :details, default: {}; t.timestamps
    end
  end
end
