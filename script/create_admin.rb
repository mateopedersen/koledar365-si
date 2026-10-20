# Run on the trusted host. The generated password never enters logs or Git.
login=ENV.fetch('ADMIN_LOGIN','mateo').downcase
raise 'Uporabniško ime ni veljavno.' unless login.match?(/\A[a-z0-9._@+-]{3,100}\z/)
if Admin.exists?(email:login)
  puts 'Račun že obstaja. Geslo ni bilo spremenjeno.'
else
  password=SecureRandom.urlsafe_base64(27)
  Admin.create!(email:login,password:password,password_confirmation:password)
  file=Rails.root.join('storage/private-admin.txt')
  File.open(file,File::WRONLY|File::CREAT|File::TRUNC,0o600) do |f|
    f.write("Koledar365 — zasebni dostop\n\nPrijava: /upravljanje/prijava/\nUporabniško ime: #{login}\nGeslo: #{password}\n\nPo prijavi geslo spremenite in ta zapis shranite v upravitelju gesel.\n")
  end
  puts 'Uredniški račun je ustvarjen. Podatki so v storage/private-admin.txt (dovoljenje 0600).'
end
