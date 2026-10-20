{sl: {i18n: {plural: {rule: lambda { |n|
  n=n.abs
  n.to_f != n.to_i ? :few : {1 => :one, 2 => :two, 3 => :few, 4 => :few}.fetch(n.to_i % 100, :other)
}}}}}
